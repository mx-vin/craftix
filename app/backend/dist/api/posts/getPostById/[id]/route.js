"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.GET = GET;
const server_1 = require("next/server");
const cors_1 = require("../../../../utilities/cors");
const db_1 = __importDefault(require("../../../../utilities/db"));
async function OPTIONS() {
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    try {
        const { id } = await ctx.params;
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return server_1.NextResponse.json({ error: "Invalid post id" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const rows = await (0, db_1.default) `
      SELECT
        p.id::text             AS "id",
        p.user_id::text        AS "userId",
        u.username             AS "username",
        p.content              AS "content",
        p.image_uri            AS "imageUri",
        p.is_sensitive         AS "isSensitive",
        p.has_offensive_text   AS "hasOffensiveText",
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ${id}::uuid
      LIMIT 1
    `;
        if (!rows.length) {
            return server_1.NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        return server_1.NextResponse.json(rows[0], { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching post by id:", error);
        return server_1.NextResponse.json({ success: false, message: "Failed to fetch post" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
