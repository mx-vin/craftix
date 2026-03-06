"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.OPTIONS = OPTIONS;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../../utilities/db"));
const cors_1 = require("../../../../utilities/cors");
// GET /api/likes/view-likes/[postId]
async function GET(_req, ctx) {
    try {
        const { id } = await ctx.params;
        // Validate UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return server_1.NextResponse.json({ error: "Invalid post id" }, { status: 400, headers: cors_1.corsHeaders });
        }
        // Fetch all users who liked the post
        const rows = await (0, db_1.default) `
      SELECT
        (pl.user_id::text || '-' || pl.post_id::text) AS "id",
        pl.user_id::text AS "user_id",
        pl.post_id::text AS "post_id",
        u.username,
        u.profile_image,
        pl.created_at
      FROM post_likes pl
      LEFT JOIN users u ON u.id = pl.user_id
      WHERE pl.post_id = ${id}::uuid
      ORDER BY pl.created_at DESC
    `;
        const likes = rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            post_id: row.post_id,
            username: row.username ?? null,
            profileImage: row.profile_image ?? null,
            created_at: row.created_at,
        }));
        return server_1.NextResponse.json(likes, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching likes list:", error);
        return server_1.NextResponse.json({ error: "Failed to fetch likes list" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
// Handle preflight CORS requests
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
