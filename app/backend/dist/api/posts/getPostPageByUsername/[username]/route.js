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
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(req, ctx) {
    try {
        const { username } = await ctx.params;
        if (!username) {
            return server_1.NextResponse.json({ success: false, message: "username required" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const postsPerPage = parseInt(searchParams.get("postsPerPage") || "10");
        const offset = (page - 1) * postsPerPage;
        const rows = await (0, db_1.default) `
      SELECT
        p.id::text          AS "id",
        p.user_id::text     AS "userId",
        u.username          AS "username",
        p.content           AS "content",
        p.image_uri         AS "imageUri",
        p.is_sensitive      AS "isSensitive",
        p.has_offensive_text AS "hasOffensiveText",
        p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
      OFFSET ${offset} LIMIT ${postsPerPage}
    `;
        return server_1.NextResponse.json(rows, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error fetching paginated posts by username:", err);
        return server_1.NextResponse.json({ success: false, message: "Error fetching posts by username", error: err.message }, { status: 500, headers: cors_1.corsHeaders });
    }
}
