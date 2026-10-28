import { isDbConnected, queryPostgres } from '../db/index.js';

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
}

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('Email này đã được đăng ký.');
    this.name = 'DuplicateEmailError';
  }
}

export async function createUser(user: NewUserRecord): Promise<UserRecord> {
  if (!isDbConnected()) {
    throw new Error('PostgreSQL chưa sẵn sàng.');
  }

  try {
    const result = await queryPostgres<UserRow>(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone`,
      [user.fullName, user.email, user.phone, user.passwordHash]
    );
    const createdUser = result.rows[0];

    if (!createdUser) {
      throw new Error('Không thể tạo tài khoản.');
    }

    return {
      id: createdUser.id,
      name: createdUser.full_name,
      email: createdUser.email,
      phone: createdUser.phone,
    };
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === '23505' &&
      'constraint' in err &&
      err.constraint === 'users_email_key'
    ) {
      throw new DuplicateEmailError();
    }
    throw err;
  }
}