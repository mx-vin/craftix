"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../../utilities/db"));
const cors_1 = require("../../../../utilities/cors");
// GET /api/like/user-likes/[username]
async function GET(req) {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const username = segments[segments.length - 1];
    if (!username) {
        return server_1.NextResponse.json({ message: "Missing username" }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        // Fetch posts liked by the user
        const rows = await (0, db_1.default) `
      SELECT 
        p.id AS post_id,
        p.content,
        p.image_uri,
        u.id AS post_user_id,
        u.username AS post_username,
        p.created_at
      FROM post_likes pl
      INNER JOIN posts p ON pl.post_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN users liker ON pl.user_id = liker.id
      WHERE liker.username = ${username}
      ORDER BY p.created_at DESC
    `;
        return server_1.NextResponse.json({ posts: rows }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching user likes:", error);
        return server_1.NextResponse.json({ message: "Server error fetching liked posts" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
