"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) {
        return server_1.NextResponse.json({ error: "username is required" }, { status: 400 });
    }
    try {
        const rows = await (0, db_1.default) `
      SELECT
        p.id::text              AS "_id",
        p.user_id::text        AS "userId",
        u.username             AS "username",
        p.content              AS "content",
        p.image_uri            AS "imageUri",
        p.is_sensitive         AS "isSensitive",
        p.has_offensive_text   AS "hasOffensiveText",
        p.created_at           AS "createdAt"
      FROM posts p
      JOIN users u
        ON u.id = p.user_id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
    `;
        return server_1.NextResponse.json(rows);
    }
    catch (err) {
        console.error("feed/username error:", err);
        return server_1.NextResponse.json({ error: "Failed to fetch user feed" }, { status: 500 });
    }
}
