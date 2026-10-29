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
}

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email này đã được đăng ký.");
    this.name = "DuplicateEmailError";
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

    const result = await client.query<UserRow>(
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
    await client.query("COMMIT");
    transactionStarted = false;

    return {
      id: createdUser.id,
      name: createdUser.full_name,
      email: createdUser.email,
      phone: createdUser.phone,
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
