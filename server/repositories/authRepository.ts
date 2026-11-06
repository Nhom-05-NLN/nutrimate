import { getPool, isDbConnected } from "../db/index.js";

export interface NewUserRecord {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
}

export interface LoginUserRecord extends UserRecord {
  role: "customer" | "admin";
  passwordHash: string | null;
  dietPreferences: string[];
}

export interface CurrentUserRecord extends UserRecord {
  role: "customer" | "admin";
  dietPreferences: string[];
}

export interface UserAddressRecord {
  addressId: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  houseNumber: string;
  street: string;
  hamlet: string;
  ward: string;
  province: string;
  isDefault: boolean;
}

export interface UserAddressInput {
  receiverName: string;
  receiverPhone: string;
  houseNumber: string;
  street: string;
  hamlet: string;
  ward: string;
  province: string;
}

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avt_url: string | null;
  role: "customer" | "admin";
  password_hash: string | null;
  diet_preferences: string[];
}

interface CreatedUserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
}

interface CurrentUserRow extends CreatedUserRow {
  avt_url: string | null;
  role: "customer" | "admin";
  diet_preferences: string[];
}

interface AddressRow {
  address_id: number;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  house_number: string | null;
  street: string | null;
  hamlet: string | null;
  ward: string | null;
  province: string | null;
  is_default: boolean | null;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email này đã được đăng ký.");
    this.name = "DuplicateEmailError";
  }
}

export async function findUserForLogin(
  identifier: string,
  expectedRole: "customer" | "admin",
): Promise<LoginUserRecord | null> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const result = await getPool().query<UserRow>(
    `SELECT users.id, users.full_name, users.email, users.phone, users.avt_url,
            users.diet_preferences,
            CASE WHEN EXISTS (
              SELECT 1 FROM admins WHERE admins.user_id = users.id
            ) THEN 'admin' ELSE 'customer' END AS role,
            users.password_hash
     FROM users
     WHERE (LOWER(users.email) = $1 OR users.phone = $2)
       AND (
         ($3 = 'admin' AND EXISTS (
           SELECT 1 FROM admins WHERE admins.user_id = users.id
         ))
         OR ($3 = 'customer' AND EXISTS (
           SELECT 1 FROM customers WHERE customers.user_id = users.id
         ) AND NOT EXISTS (
           SELECT 1 FROM admins WHERE admins.user_id = users.id
         ))
       )
     LIMIT 2`,
    [identifier.toLowerCase(), identifier, expectedRole],
  );

  if (result.rows.length !== 1) {
    return null;
  }

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avt_url,
    role: user.role,
    passwordHash: user.password_hash,
    dietPreferences: user.diet_preferences,
  };
}

export async function createCustomerLoginNotification(
  user: Pick<LoginUserRecord, "id" | "name" | "email">,
): Promise<void> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  await getPool().query(
    `INSERT INTO admin_notifications (type, title, message, customer_id)
     VALUES ('customer_logged_in', 'Khách hàng đăng nhập', $1, $2)`,
    [`${user.name} (${user.email}) vừa đăng nhập.`, user.id],
  );
}

export async function findUserById(id: string): Promise<CurrentUserRecord | null> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const result = await getPool().query<CurrentUserRow>(
    `SELECT users.id, users.full_name, users.email, users.phone, users.avt_url,
            users.diet_preferences,
            CASE WHEN EXISTS (
              SELECT 1 FROM admins WHERE admins.user_id = users.id
            ) THEN 'admin' ELSE 'customer' END AS role
     FROM users
     WHERE users.id = $1
     LIMIT 1`,
    [id],
  );
  const user = result.rows[0];
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avt_url,
    role: user.role,
    dietPreferences: user.diet_preferences,
  };
}

export async function updateUserDietPreferences(
  id: string,
  dietPreferences: string[],
): Promise<string[] | null> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const result = await getPool().query<{ diet_preferences: string[] }>(
    `UPDATE users
     SET diet_preferences = $2::jsonb, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING diet_preferences`,
    [id, JSON.stringify(dietPreferences)],
  );
  return result.rows[0]?.diet_preferences ?? null;
}

export async function updateUserAvatar(id: string, avatarUrl: string): Promise<string | undefined> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const result = await getPool().query<{ avt_url: string }>(
    `UPDATE users
     SET avt_url = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING avt_url`,
    [id, avatarUrl],
  );
  return result.rows[0]?.avt_url;
}

function mapAddress(address: AddressRow): UserAddressRecord {
  return {
    addressId: address.address_id,
    receiverName: address.receiver_name,
    receiverPhone: address.receiver_phone,
    address: address.address,
    houseNumber: address.house_number ?? "",
    street: address.street ?? "",
    hamlet: address.hamlet ?? "",
    ward: address.ward ?? "",
    province: address.province ?? "",
    isDefault: address.is_default ?? false,
  };
}

export async function findUserAddresses(id: string): Promise<UserAddressRecord[]> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const result = await getPool().query<AddressRow>(
    `SELECT address.address_id, address.receiver_name, address.receiver_phone, address.address,
            address.house_number, address.street, address.hamlet, address.ward,
            address.province, address.is_default
     FROM addresses AS address
     JOIN customers AS customer ON customer.user_id = address.customer_id
     WHERE customer.user_id = $1
     ORDER BY address.is_default DESC NULLS LAST, address.updated_at DESC NULLS LAST,
              address.address_id DESC`,
    [id],
  );
  return result.rows.map(mapAddress);
}

export async function updateUserProfile(
  id: string,
  profile: Pick<NewUserRecord, "fullName" | "email" | "phone">,
): Promise<UserRecord | null> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  try {
    const result = await getPool().query<CreatedUserRow>(
      `UPDATE users
       SET full_name = $2, email = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, full_name, email, phone`,
      [id, profile.fullName, profile.email, profile.phone],
    );
    const user = result.rows[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone ?? "",
    };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "23505" &&
      "constraint" in err &&
      err.constraint === "users_email_key"
    ) {
      throw new DuplicateEmailError();
    }
    throw err;
  }
}

function formatAddress(address: UserAddressInput): string {
  return [
    address.houseNumber,
    address.street,
    address.hamlet,
    address.ward,
    address.province,
  ].filter(Boolean).join(", ");
}

export async function createUserAddress(
  userId: string,
  address: UserAddressInput,
): Promise<UserAddressRecord> {
  if (!isDbConnected()) throw new Error("PostgreSQL chưa sẵn sàng.");

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [userId],
    );
    if (!user.rows[0]) {
      throw new Error("Không tìm thấy tài khoản để lưu địa chỉ.");
    }

    const customer = await client.query<{ user_id: number }>(
      `SELECT user_id FROM customers WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const customerId = customer.rows[0]?.user_id;
    if (customerId === undefined) {
      throw new Error("Không tìm thấy hồ sơ khách hàng để lưu địa chỉ.");
    }

    const existing = await client.query<{ has_default: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM addresses
         WHERE customer_id = $1 AND is_default IS TRUE
       ) AS has_default`,
      [customerId],
    );
    const isDefault = !existing.rows[0]?.has_default;
    if (isDefault) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $1 AND is_default IS TRUE`,
        [customerId],
      );
    }

    const result = await client.query<AddressRow>(
      `INSERT INTO addresses
         (customer_id, receiver_name, receiver_phone, address,
          house_number, street, hamlet, ward, province, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING address_id, receiver_name, receiver_phone, address,
                 house_number, street, hamlet, ward, province, is_default`,
      [
        customerId,
        address.receiverName,
        address.receiverPhone,
        formatAddress(address),
        address.houseNumber,
        address.street,
        address.hamlet,
        address.ward,
        address.province,
        isDefault,
      ],
    );
    const created = result.rows[0];
    if (!created) throw new Error("Không thể tạo địa chỉ nhận hàng.");
    await client.query("COMMIT");
    return mapAddress(created);
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch((rollbackError: unknown) => {
      const message = rollbackError instanceof Error ? rollbackError.message : "Unknown rollback error";
      console.error("[AuthRepository] Không thể rollback tạo địa chỉ:", message);
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserAddress(
  userId: string,
  addressId: number,
  address: UserAddressInput,
): Promise<UserAddressRecord | null> {
  if (!isDbConnected()) throw new Error("PostgreSQL chưa sẵn sàng.");

  const result = await getPool().query<AddressRow>(
    `UPDATE addresses AS target
     SET receiver_name = $3, receiver_phone = $4, address = $5,
         house_number = $6, street = $7, hamlet = $8, ward = $9,
         province = $10, updated_at = CURRENT_TIMESTAMP
     FROM customers AS customer
     WHERE target.address_id = $1
       AND customer.user_id = $2
       AND target.customer_id = customer.user_id
     RETURNING target.address_id, target.receiver_name, target.receiver_phone, target.address,
               target.house_number, target.street, target.hamlet, target.ward,
               target.province, target.is_default`,
    [
      addressId,
      userId,
      address.receiverName,
      address.receiverPhone,
      formatAddress(address),
      address.houseNumber,
      address.street,
      address.hamlet,
      address.ward,
      address.province,
    ],
  );
  const updated = result.rows[0];
  return updated ? mapAddress(updated) : null;
}

export async function setDefaultUserAddress(userId: string, addressId: number): Promise<boolean> {
  if (!isDbConnected()) throw new Error("PostgreSQL chưa sẵn sàng.");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const customer = await client.query<{ user_id: number }>(
      "SELECT user_id FROM customers WHERE user_id = $1 FOR UPDATE",
      [userId],
    );
    const customerId = customer.rows[0]?.user_id;
    if (customerId === undefined) {
      await client.query("ROLLBACK");
      return false;
    }

    const target = await client.query(
      `SELECT address_id FROM addresses
       WHERE address_id = $1 AND customer_id = $2
       FOR UPDATE`,
      [addressId, customerId],
    );
    if (!target.rows[0]) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      `UPDATE addresses SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $1 AND is_default IS TRUE`,
      [customerId],
    );
    await client.query(
      `UPDATE addresses SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE address_id = $1 AND customer_id = $2`,
      [addressId, customerId],
    );
    await client.query("COMMIT");
    return true;
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch((rollbackError: unknown) => {
      const message = rollbackError instanceof Error ? rollbackError.message : "Unknown rollback error";
      console.error("[AuthRepository] Không thể rollback đặt địa chỉ mặc định:", message);
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteUserAddress(userId: string, addressId: number): Promise<boolean> {
  if (!isDbConnected()) throw new Error("PostgreSQL chưa sẵn sàng.");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const customer = await client.query<{ user_id: number }>(
      "SELECT user_id FROM customers WHERE user_id = $1 FOR UPDATE",
      [userId],
    );
    const customerId = customer.rows[0]?.user_id;
    if (customerId === undefined) {
      await client.query("ROLLBACK");
      return false;
    }

    const removed = await client.query<{ is_default: boolean | null }>(
      `DELETE FROM addresses
       WHERE address_id = $1 AND customer_id = $2
       RETURNING is_default`,
      [addressId, customerId],
    );
    const deleted = removed.rows[0];
    if (!deleted) {
      await client.query("ROLLBACK");
      return false;
    }
    if (deleted.is_default) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $1 AND is_default IS TRUE`,
        [customerId],
      );
      const nextAddress = await client.query<{ address_id: number }>(
        `SELECT address_id FROM addresses
         WHERE customer_id = $1
         ORDER BY updated_at DESC NULLS LAST, address_id DESC
         LIMIT 1`,
        [customerId],
      );
      if (nextAddress.rows[0]) {
        await client.query(
          `UPDATE addresses SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
           WHERE address_id = $1 AND customer_id = $2`,
          [nextAddress.rows[0].address_id, customerId],
        );
      }
    }
    await client.query("COMMIT");
    return true;
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch((rollbackError: unknown) => {
      const message = rollbackError instanceof Error ? rollbackError.message : "Unknown rollback error";
      console.error("[AuthRepository] Không thể rollback xóa địa chỉ:", message);
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(user: NewUserRecord): Promise<UserRecord> {
  if (!isDbConnected()) {
    throw new Error("PostgreSQL chưa sẵn sàng.");
  }

  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query<CreatedUserRow>(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone`,
      [user.fullName, user.email, user.phone, user.passwordHash],
    );
    const createdUser = result.rows[0];

    if (!createdUser) {
      throw new Error("Không thể tạo tài khoản.");
    }

    await client.query("INSERT INTO customers (user_id) VALUES ($1)", [
      createdUser.id,
    ]);
    await client.query(
      `INSERT INTO admin_notifications (type, title, message, customer_id)
       VALUES ('customer_registered', 'Khách hàng mới đăng ký', $1, $2)`,
      [`${createdUser.full_name} (${createdUser.email}) vừa tạo tài khoản.`, createdUser.id],
    );
    await client.query("COMMIT");
    transactionStarted = false;

    return {
      id: createdUser.id,
      name: createdUser.full_name,
      email: createdUser.email,
      phone: createdUser.phone ?? "",
    };
  } catch (err: unknown) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError: unknown) {
        const message =
          rollbackError instanceof Error
            ? rollbackError.message
            : "Unknown rollback error";
        console.error("[AuthRepository] Không thể rollback đăng ký:", message);
      }
    }

    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "23505" &&
      "constraint" in err &&
      err.constraint === "users_email_key"
    ) {
      throw new DuplicateEmailError();
    }
    throw err;
  } finally {
    client.release();
  }
}
