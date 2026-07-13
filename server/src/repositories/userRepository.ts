import type { DatabaseSync } from "node:sqlite";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export class UserRepository {
  constructor(private db: DatabaseSync) {}

  findByEmail(email: string): User | undefined {
    const row = this.db
      .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  }

  create(input: { name: string; email: string; passwordHash: string }): User {
    const result = this.db
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(input.name, input.email, input.passwordHash);
    const row = this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(Number(result.lastInsertRowid)) as unknown as UserRow;
    return toUser(row);
  }
}
