"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRevenue = fetchRevenue;
exports.fetchLatestInvoices = fetchLatestInvoices;
exports.fetchCardData = fetchCardData;
exports.fetchFilteredInvoices = fetchFilteredInvoices;
exports.fetchInvoicesPages = fetchInvoicesPages;
exports.fetchInvoiceById = fetchInvoiceById;
exports.fetchCustomers = fetchCustomers;
exports.fetchFilteredCustomers = fetchFilteredCustomers;
exports.registerUser = registerUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../utilities/db"));
const utils_1 = require("./utils");
// Notice that this file contains utility functions that are called internally by the server components.
// Example: the user requests a page that contains a server component <RevenueChart> that calls fetchRevenue().
// This is done on the server side, not on the client side.  The data is fetched from the database 
// and returned to the server component.  The server component then renders the page containing the 
// RevenueChart including the data.  This is different than an API endpoint which is provided by the server
// to be called externally by the client.
async function fetchRevenue() {
    try {
        // Artificially delay a response for demo purposes.
        // Don't do this in production :)
        console.log('Fetching revenue data...');
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        const data = await (0, db_1.default) `SELECT * FROM revenue`;
        console.log('Data fetch completed after 3 seconds.');
        return data;
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch revenue data.');
    }
}
async function fetchLatestInvoices() {
    try {
        const data = await (0, db_1.default) `
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
        const latestInvoices = data.map((invoice) => ({
            ...invoice,
            amount: (0, utils_1.formatCurrency)(invoice.amount),
        }));
        return latestInvoices;
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch the latest invoices.');
    }
}
async function fetchCardData() {
    try {
        // You can probably combine these into a single SQL query
        // However, we are intentionally splitting them to demonstrate
        // how to initialize multiple queries in parallel with JS.
        const invoiceCountPromise = (0, db_1.default) `SELECT COUNT(*) FROM invoices`;
        const customerCountPromise = (0, db_1.default) `SELECT COUNT(*) FROM customers`;
        const invoiceStatusPromise = (0, db_1.default) `SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
        const data = await Promise.all([
            invoiceCountPromise,
            customerCountPromise,
            invoiceStatusPromise,
        ]);
        const numberOfInvoices = Number(data[0][0].count ?? '0');
        const numberOfCustomers = Number(data[1][0].count ?? '0');
        const totalPaidInvoices = (0, utils_1.formatCurrency)(data[2][0].paid ?? '0');
        const totalPendingInvoices = (0, utils_1.formatCurrency)(data[2][0].pending ?? '0');
        return {
            numberOfCustomers,
            numberOfInvoices,
            totalPaidInvoices,
            totalPendingInvoices,
        };
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch card data.');
    }
}
const ITEMS_PER_PAGE = 6;
async function fetchFilteredInvoices(query, currentPage) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    try {
        const invoices = await (0, db_1.default) `
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
        return invoices;
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices.');
    }
}
async function fetchInvoicesPages(query) {
    try {
        const data = await (0, db_1.default) `SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;
        const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
        return totalPages;
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch total number of invoices.');
    }
}
async function fetchInvoiceById(id) {
    try {
        const data = await (0, db_1.default) `
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;
        const invoice = data.map((invoice) => ({
            ...invoice,
            // Convert amount from cents to dollars
            amount: invoice.amount / 100,
        }));
        return invoice[0];
    }
    catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoice.');
    }
}
async function fetchCustomers() {
    try {
        const customers = await (0, db_1.default) `
      SELECT
        id,
        name,
        email,
        image_url
      FROM customers
      ORDER BY name ASC
    `;
        return customers;
    }
    catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch all customers.');
    }
}
async function fetchFilteredCustomers(query) {
    try {
        // Yannie modified, added email and image_url to the select statement
        const data = await (0, db_1.default) `
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;
        // Yannie modified ends here
        const customers = data.map((customer) => ({
            ...customer,
            total_pending: (0, utils_1.formatCurrency)(customer.total_pending),
            total_paid: (0, utils_1.formatCurrency)(customer.total_paid),
        }));
        return customers;
    }
    catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch customer table.');
    }
}
async function registerUser(name, email, password_hash) {
    // Check if user already exists
    const existing = await (0, db_1.default) `SELECT * FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
        throw new Error('User already exists');
    }
    // Hash the password_hash
    const hashed = await bcryptjs_1.default.hash(password_hash, 10);
    // Insert new user
    await (0, db_1.default) `
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${hashed})
  `;
}
