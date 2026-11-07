import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import routes from '../server/routes/adminCategoryRoutes.js';
import { listAdminCategories, validateCategory, CategoryInputError } from '../server/repositories/adminCategoryRepository.js';
import { queryPostgres } from '../server/db/index.js';

test('category input accepts only valid names and descriptions', () => {
  assert.deepEqual(validateCategory({ name:' Category ',description:' Text ',status:false }),{ name:'Category',description:'Text',status:false });
  for (const input of [{ name:'a',description:'' },{ name:'x'.repeat(101),description:'' },
    { name:'Valid',description:4 },{ name:'Valid',description:'x'.repeat(5001) }]) {
    assert.throws(() => validateCategory({ ...input,status:true }),CategoryInputError);
  }
  for (const status of [undefined,null,'false',0]) {
    assert.throws(() => validateCategory({ name:'Valid',description:'',status }),CategoryInputError);
  }
});

test('category list uses real ID relationships and has no seeded empty fallback',async () => {
  const empty = (async (sql: string) => {
    assert.match(sql,/p.category_id=c.category_id/);
    assert.match(sql,/c.status/);
    assert.doesNotMatch(sql,/c\.(slug|created_at|code)/);
    return { rows:[] };
  }) as unknown as typeof queryPostgres;
  assert.deepEqual(await listAdminCategories(empty),[]);
  const row = (async () => ({ rows:[{ id:'4',name:'Category',description:'',productCount:0,products:[] }] })) as unknown as typeof queryPostgres;
  assert.equal((await listAdminCategories(row))[0]?.code,'CAT-04');
});

test('category CRUD endpoints require authentication',async () => {
  const app=express();app.use(express.json());app.use('/api/admin/categories',routes);
  const server=createServer(app);
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const address=server.address();assert(address && typeof address !== 'string');
    for(const [method,suffix] of [['GET',''],['POST',''],['PUT','/4'],['DELETE','/4']]) {
      assert.equal((await fetch(`http://127.0.0.1:${address.port}/api/admin/categories${suffix}`,{ method })).status,401);
    }
  } finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
});
