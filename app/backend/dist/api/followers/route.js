"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../utilities/db"));
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) {
        return server_1.NextResponse.json({ error: "Missing username query parameter" }, { status: 400 });
    }
    try {
        const rows = await (0, db_1.default) `
      SELECT
        u.id,
        u.username
      FROM followers f
      JOIN users me
        ON me.id = f.follower_id
      JOIN users u
        ON u.id = f.following_id
      WHERE me.username = ${username}
      ORDER BY f.created_at DESC
    `;
        return server_1.NextResponse.json(rows);
    }
    catch (err) {
        console.error(err);
        return server_1.NextResponse.json({ error: "Failed to fetch following list" }, { status: 500 });
    }
}
