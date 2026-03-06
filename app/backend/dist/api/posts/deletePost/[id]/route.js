"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const cors_1 = require("../../../../utilities/cors");
const db_1 = __importDefault(require("../../../../utilities/db"));
async function OPTIONS() {
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
async function DELETE(_req, ctx) {
    try {
        const { id } = await ctx.params;
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return server_1.NextResponse.json({ error: "Invalid post id" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const result = await (0, db_1.default) `
      DELETE FROM posts
      WHERE id = ${id}::uuid
      RETURNING TRUE AS deleted;
    `;
        if (result.length === 0) {
            return server_1.NextResponse.json({ error: "Post not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        return server_1.NextResponse.json({ success: true, message: "Post deleted successfully", data: { postId: id } }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error deleting post:", err);
        return server_1.NextResponse.json({ error: "Failed to delete post" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
