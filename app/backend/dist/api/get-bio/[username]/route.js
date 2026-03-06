"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
async function GET(_req, { params }) {
    const { username } = params;
    try {
        // Fetch user info from Supabase schema
        const rows = await (0, db_1.default) `
      SELECT 
        id,
        username,
        email
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
        if (!rows[0]) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        const user = rows[0];
        return server_1.NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            // Add profileImage/biography if you add columns later
            profileImage: null,
            biography: null
        });
    }
    catch (err) {
        console.error("get-bio error:", err);
        return server_1.NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
    }
}
