import type { DatabaseSync } from "node:sqlite";
import type { Ticket } from "../domain/types.js";
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from "../domain/validation.js";

interface TicketRow {
  id: number;
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  status: Ticket["status"];
  priority: Ticket["priority"];
  created_at: string;
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

export class TicketRepository {
  constructor(private db: DatabaseSync) {}

  list(query: ListTicketsQuery): Ticket[] {
    const conditions: string[] = [];
    const params: string[] = [];

    if (query.status) {
      conditions.push("status = ?");
      params.push(query.status);
    }
    if (query.priority) {
      conditions.push("priority = ?");
      params.push(query.priority);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = this.db
      .prepare(`SELECT * FROM tickets ${where} ORDER BY created_at DESC, id DESC`)
      .all(...params) as unknown as TicketRow[];
    return rows.map(toTicket);
  }

  findById(id: number): Ticket | undefined {
    const row = this.db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as
      | TicketRow
      | undefined;
    return row ? toTicket(row) : undefined;
  }

  create(input: CreateTicketInput): Ticket {
    const result = this.db
      .prepare(
        `INSERT INTO tickets (title, description, customer_name, customer_email, priority, status)
         VALUES (?, ?, ?, ?, ?, 'open')`
      )
      .run(input.title, input.description, input.customerName, input.customerEmail, input.priority);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, input: UpdateTicketInput): Ticket | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const assignments: string[] = [];
    const params: (string | number)[] = [];
    // SQL injection safety: iterate the hard-coded whitelist (never the input's
    // own keys), so only these exact column names can appear in the statement.
    // All values are bound via `?` placeholders.
    for (const [field, column] of UPDATABLE_COLUMNS) {
      const value = input[field];
      if (value === undefined) continue;
      assignments.push(`${column} = ?`);
      params.push(value);
    }
    params.push(id);

    this.db.prepare(`UPDATE tickets SET ${assignments.join(", ")} WHERE id = ?`).run(...params);
    return this.findById(id);
  }
}

const UPDATABLE_COLUMNS: ReadonlyArray<[keyof UpdateTicketInput, string]> = [
  ["title", "title"],
  ["description", "description"],
  ["customerName", "customer_name"],
  ["customerEmail", "customer_email"],
  ["priority", "priority"],
  ["status", "status"],
];
