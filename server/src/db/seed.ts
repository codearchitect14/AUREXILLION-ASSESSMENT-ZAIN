import { createDb } from "./index.js";
import { hashPassword } from "../utils/password.js";

const db = createDb();

const userCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
if (userCount === 0) {
  db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(
    "Demo Agent",
    "agent@example.com",
    hashPassword("Password123!")
  );
  console.log("Seeded user: agent@example.com / Password123!");
} else {
  console.log("Users already exist, skipping user seed.");
}

const count = (db.prepare("SELECT COUNT(*) AS n FROM tickets").get() as { n: number }).n;
if (count > 0) {
  console.log(`Database already has ${count} tickets, skipping ticket seed.`);
  process.exit(0);
}

const seedTickets = [
  {
    title: "Unable to complete payment",
    description:
      "The customer receives an error after submitting the payment form. The error appears intermittently and only on Visa cards.",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    status: "open",
    priority: "high",
    createdAt: "2026-07-10T10:30:00.000Z",
  },
  {
    title: "Password reset email not arriving",
    description:
      "Customer requested a password reset three times but never received the email. Checked spam folder already.",
    customerName: "Carlos Rivera",
    customerEmail: "carlos.rivera@example.com",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-07-09T14:05:00.000Z",
  },
  {
    title: "Invoice shows wrong billing address",
    description:
      "The June invoice lists the customer's old billing address even though it was updated in account settings in May.",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    status: "open",
    priority: "low",
    createdAt: "2026-07-08T09:12:00.000Z",
  },
  {
    title: "App crashes when uploading attachments",
    description:
      "Uploading any file larger than 5 MB causes the mobile app to crash immediately. Reproduced on iOS 19 and Android 16.",
    customerName: "Tom Becker",
    customerEmail: "tom.becker@example.com",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-07-07T16:45:00.000Z",
  },
  {
    title: "Feature request: export tickets to CSV",
    description:
      "Customer would like the ability to export their support history as a CSV file for internal reporting.",
    customerName: "Aisha Khan",
    customerEmail: "aisha.khan@example.com",
    status: "resolved",
    priority: "low",
    createdAt: "2026-07-05T11:20:00.000Z",
  },
  {
    title: "Two-factor authentication codes rejected",
    description:
      "Authenticator codes are consistently rejected as invalid. Customer's device clock is confirmed to be in sync.",
    customerName: "Liam O'Connor",
    customerEmail: "liam.oconnor@example.com",
    status: "resolved",
    priority: "medium",
    createdAt: "2026-07-03T08:00:00.000Z",
  },
] as const;

const insert = db.prepare(
  `INSERT INTO tickets (title, description, customer_name, customer_email, status, priority, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

db.exec("BEGIN");
for (const t of seedTickets) {
  insert.run(t.title, t.description, t.customerName, t.customerEmail, t.status, t.priority, t.createdAt);
}
db.exec("COMMIT");

console.log(`Seeded ${seedTickets.length} tickets.`);
