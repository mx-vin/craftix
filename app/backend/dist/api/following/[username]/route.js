"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
const cors_1 = require("../../../utilities/cors");
async function GET(req, { params }) {
    const { username } = params;
    if (!username) {
        return server_1.NextResponse.json({ message: "Username is required" }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        const rows = await (0, db_1.default) `
      SELECT u.id, u.username, u.email, u.is_admin, u.created_at
      FROM followers f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = (SELECT id FROM users WHERE username = ${username})
      ORDER BY f.created_at DESC
    `;
        return server_1.NextResponse.json(rows, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error fetching following list:", err);
        return server_1.NextResponse.json({ message: "Server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
