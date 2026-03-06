"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = PUT;
const server_1 = require("next/server");
const cors_1 = require("../../../../utilities/cors");
const db_1 = __importDefault(require("../../../../utilities/db"));
async function PUT(req, ctx) {
    try {
        const { postId } = await ctx.params;
        const body = await req.json();
        const { content, isSensitive } = body;
        if (!postId || !content) {
            return server_1.NextResponse.json({ error: "Missing postId or content" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const updated = await (0, db_1.default) `
      UPDATE posts
      SET 
        content = ${content},
        is_sensitive = COALESCE(${isSensitive}, is_sensitive)
      WHERE id = ${postId}::uuid
      RETURNING id, user_id, content, is_sensitive;
    `;
        if (!updated.length)
            return server_1.NextResponse.json({ error: "Post not found" }, { status: 404, headers: cors_1.corsHeaders });
        return server_1.NextResponse.json({ success: true, message: "Post updated", post: updated[0] }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error updating post:", err);
        return server_1.NextResponse.json({ success: false, message: "Failed to update post", error: err.message }, { status: 500, headers: cors_1.corsHeaders });
    }
}
