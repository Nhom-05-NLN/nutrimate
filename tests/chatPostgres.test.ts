import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createChatTestDatabase } from './chatTestDatabase.js';
import { config } from '../server/config.js';
import { ChatConversationRepository } from '../server/repositories/chatConversationRepository.js';
import { createChatService } from '../server/services/chatService.js';
import { ChatError } from '../server/types/chat.js';

test('PostgreSQL: additive migration, ownership, atomic history, rollback and idempotency', { skip: process.env.CHAT_TEST_POSTGRES !== '1' }, async () => {
  const database = await createChatTestDatabase();
  try {
    await database.pool.query(`
      CREATE TABLE customers (user_id INTEGER PRIMARY KEY REFERENCES users(id));
      INSERT INTO customers (user_id) VALUES (1);
      CREATE TABLE orders (
        order_id SERIAL PRIMARY KEY,
        id INTEGER,
        order_code TEXT NOT NULL,
        order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ,
        receiver_name TEXT,
        customer_name TEXT,
        receiver_phone TEXT,
        customer_phone TEXT,
        receiver_email TEXT,
        customer_email TEXT,
        note TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        user_id INTEGER REFERENCES users(id),
        customer_id INTEGER REFERENCES customers(user_id)
      );
    `);
    const orderOwnershipMigration = (await readFile(new URL('../server/db/migrations/013_order_customer_ownership.sql', import.meta.url), 'utf8'))
      .replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '');
    await database.pool.query(orderOwnershipMigration);
    await database.pool.query(`
      CREATE TRIGGER trg_sync_order_customer_fields
      BEFORE INSERT OR UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION fn_sync_order_customer_fields()
    `);
    await database.pool.query(`
      CREATE TABLE order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(order_id),
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL
      );
      INSERT INTO orders (order_code, status, payment_status, total_amount, user_id, customer_id)
      VALUES ('NM-123456', 'shipping', 'paid', 287000, 1, 1);
      INSERT INTO order_items (order_id, product_name, quantity)
      VALUES (1, 'Bún Shirataki', 2);
      INSERT INTO orders (order_code, status, payment_status, total_amount, customer_email, customer_phone)
      VALUES ('NM-654321', 'confirmed', 'paid', 120000, 'legacy@example.test', '090-000-0001');
      UPDATE orders SET customer_name = 'Owner One' WHERE order_code = 'NM-654321';
      INSERT INTO order_items (order_id, product_name, quantity)
      VALUES (2, 'Granola', 1);
      INSERT INTO orders (order_code, status, payment_status, total_amount, customer_name, customer_email, customer_phone)
      VALUES ('NM-777777', 'pending', 'pending', 80000, 'Owner One', 'owner@example.test', '0900000099');
    `);
    const adminOrder = await database.pool.query(
      `INSERT INTO orders (order_code, status, payment_status, total_amount, user_id)
       VALUES ('NM-888888', 'confirmed', 'paid', 50000, 2)
       RETURNING user_id = 2 AS user_is_owner, customer_id IS NULL AS customer_is_unset`,
    );
    assert.deepEqual(adminOrder.rows[0], { user_is_owner: true, customer_is_unset: true });

    const repository = new ChatConversationRepository(database.pool);
    const owner = { userId: 1, guestHash: null } as const;
    const other = { userId: 2, guestHash: null } as const;
    const conversation = await repository.create(owner);
    const botLink = await database.pool.query<{ bot_id: number; provider: string; model: string }>(
      `SELECT bot.bot_id, bot.provider, bot.model
       FROM chat_conversations AS conversation
       JOIN nutribot AS bot ON bot.bot_id = conversation.bot_id
       WHERE conversation.id = $1`,
      [conversation.id],
    );
    assert.equal(botLink.rowCount, 1);
    assert.equal(botLink.rows[0]?.provider, config.chat.provider);
    assert.equal(botLink.rows[0]?.model, config.chat.model || 'unconfigured');
    await database.pool.query('UPDATE nutribot SET is_active = FALSE');
    await assert.rejects(repository.create(owner), ChatError);
    await database.pool.query('UPDATE nutribot SET is_active = TRUE');
    let aiFails = false;
    let aiCalls = 0;
    const service = createChatService(repository, async () => {
      aiCalls++;
      if (aiFails) throw new ChatError(504, 'AI timeout');
      return 'Phản hồi kiểm thử';
    }, async () => ({ products: [], knowledge: '' }));
    const orderService = createChatService(repository, async () => {
      throw new Error('Order lookup must not call AI.');
    });
    const orderConversation = await repository.create(owner);
    const orderReply = await orderService.ask(
      owner,
      orderConversation.id,
      randomUUID(),
      'NutriBot ơi, kiểm tra giúp mình tiến độ đơn hàng #NM-123456 nhé!',
    );
    assert.match(orderReply.reply, /Đang giao/);
    assert.match(orderReply.reply, /Đã thanh toán/);
    assert.match(orderReply.reply, /Bún Shirataki × 2/);
    const followUp = await orderService.ask(owner, orderConversation.id, randomUUID(), 'Đơn này đã thanh toán chưa?');
    assert.match(followUp.reply, /Đã thanh toán/);
    const legacyConversation = await repository.create(owner);
    const legacyReply = await orderService.ask(
      owner,
      legacyConversation.id,
      randomUUID(),
      'Kiểm tra đơn hàng #NM-654321',
    );
    assert.match(legacyReply.reply, /#NM-654321/);
    assert.match(legacyReply.reply, /Granola × 1/);
    const claimedOrder = await database.pool.query(
      `SELECT user_id = 1 AS claimed_by_owner, customer_id = 1 AS customer_is_owner
       FROM orders WHERE order_code = 'NM-654321'`,
    );
    assert.deepEqual(claimedOrder.rows[0], { claimed_by_owner: true, customer_is_owner: true });

    await database.pool.query(`
      INSERT INTO users VALUES (3, 'customer', 'duplicate@example.test', '0900000001', 'Owner One');
      UPDATE orders SET customer_phone = '090 000 0001' WHERE order_code = 'NM-777777';
    `);
    const ambiguousConversation = await repository.create(owner);
    const unmatchedReply = await orderService.ask(
      owner,
      ambiguousConversation.id,
      randomUUID(),
      'Kiểm tra đơn hàng #NM-777777',
    );
    assert.match(unmatchedReply.reply, /không tìm thấy/);

    const emptyOrderConversation = await repository.create(owner);
    const missingCode = await orderService.ask(owner, emptyOrderConversation.id, randomUUID(), 'Kiểm tra giúp mình đơn hàng');
    assert.match(missingCode.reply, /gửi mã đơn hàng/);

    const guest = { userId: null, guestHash: 'a'.repeat(64) } as const;
    const guestConversation = await repository.create(guest);
    const guestOrderReply = await orderService.ask(guest, guestConversation.id, randomUUID(), 'Kiểm tra đơn #NM-123456');
    assert.match(guestOrderReply.reply, /đăng nhập/);

    const otherConversation = await repository.create(other);
    const notOwnedReply = await orderService.ask(
      other,
      otherConversation.id,
      randomUUID(),
      'Kiểm tra đơn hàng #NM-123456',
    );
    assert.match(notOwnedReply.reply, /không tìm thấy/);

    await assert.rejects(repository.history(conversation.id, other), ChatError);
    await assert.rejects(service.ask(other, conversation.id, randomUUID(), 'Unauthorized'), ChatError);
    const requestId = randomUUID();
    await service.ask(owner, conversation.id, requestId, 'Câu hỏi');
    await service.ask(owner, conversation.id, requestId, 'Câu hỏi');
    assert.equal(aiCalls, 1);
    assert.equal((await repository.history(conversation.id, owner)).length, 2);
    aiFails = true;
    await assert.rejects(service.ask(owner, conversation.id, randomUUID(), 'Failure'), ChatError);
    assert.equal((await repository.history(conversation.id, owner)).length, 2);
    const history = await repository.history(conversation.id, owner);
    assert.equal((await repository.history(conversation.id, owner, history[1]!.id)).length, 1);
    assert.ok(!(await repository.list(other)).some(row => row.id === conversation.id));
    aiFails = false;
    for (let index = 0; index < 26; index++) await service.ask(owner, conversation.id, randomUUID(), `Question ${index}`);
    const latest = await repository.history(conversation.id, owner);
    assert.equal(latest.length, 50);
    assert.equal(latest.at(-2)?.content, 'Question 25');
    assert.equal((await repository.history(conversation.id, owner, latest[0]!.id)).length, 4);
  } finally { await database.close(); }
});
