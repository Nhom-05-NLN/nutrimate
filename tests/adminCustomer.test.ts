import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AdminCustomerError,
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../server/services/adminCustomerService.js';

test('admin customer listing rejects invalid page numbers', async () => {
  await assert.rejects(
    listCustomers({ page: '0' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('admin customer listing caps page size', async () => {
  await assert.rejects(
    listCustomers({ limit: 1001 }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('admin customer listing rejects non-string search values', async () => {
  await assert.rejects(
    listCustomers({ search: { value: 'customer' } }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('admin customer listing only accepts supported interaction segments', async () => {
  await assert.rejects(
    listCustomers({ segment: 'inactive' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('admin customer listing rejects excessively long search terms', async () => {
  await assert.rejects(
    listCustomers({ search: 'a'.repeat(101) }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('admin customer listing rejects unsupported database filters', async () => {
  await assert.rejects(
    listCustomers({ nutritionGoal: 'keto' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
  await assert.rejects(
    listCustomers({ bmiProfile: 'unknown' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
  await assert.rejects(
    listCustomers({ orders: 'pending' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('customer creation validates required account fields and initial password', async () => {
  await assert.rejects(
    createCustomer({ fullName: 'Customer', email: 'not-an-email', password: 'password123' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
  await assert.rejects(
    createCustomer({ fullName: 'Customer', email: 'customer@example.com', password: 'short' }),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});

test('customer update and delete reject invalid identifiers', async () => {
  await assert.rejects(
    updateCustomer('invalid', {}),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
  await assert.rejects(
    deleteCustomer('0'),
    (error: unknown) => error instanceof AdminCustomerError && error.statusCode === 400,
  );
});
