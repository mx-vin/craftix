"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const server_1 = require("next/server");
const placeholder_data_1 = require("../../lib/placeholder-data");
const db_1 = __importDefault(require("../../utilities/db"));
// USERS
async function seedUsers(db) {
    await db `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await db `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `;
    for (const user of placeholder_data_1.users) {
        const hashedPassword = await bcryptjs_1.default.hash(user.password_hash, 10);
        await db `
      INSERT INTO users (id, name, email, password_hash)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
      ON CONFLICT (id) DO NOTHING;
    `;
    }
}
// CUSTOMERS
async function seedCustomers(db) {
    await db `
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
    for (const customer of placeholder_data_1.customers) {
        await db `
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
    }
}
// INVOICES
async function seedInvoices(db) {
    await db `
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
    for (const invoice of placeholder_data_1.invoices) {
        await db `
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT DO NOTHING;
    `;
    }
}
// REVENUE
async function seedRevenue(db) {
    await db `
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
    for (const rev of placeholder_data_1.revenue) {
        await db `
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
    }
}
// MAIN GET HANDLER
async function GET() {
    try {
        await db_1.default.begin(async (tx) => {
            await seedUsers(tx);
            await seedCustomers(tx);
            await seedInvoices(tx);
            await seedRevenue(tx);
        });
        return server_1.NextResponse.json({ message: "Database seeded successfully" });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
}
