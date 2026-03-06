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
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    const { id } = await ctx.params;
    if (!id) {
        return server_1.NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }
    try {
        const likedPosts = await (0, db_1.default) `
      SELECT post_id
      FROM likes
      WHERE user_id = ${id}::uuid
    `;
        const response = likedPosts.map((row) => ({ postId: row.post_id }));
        return server_1.NextResponse.json(response, { status: 200 });
    }
    catch (err) {
        console.error("Error fetching user likes:", err);
        return server_1.NextResponse.json({ error: "Failed to fetch user likes" }, { status: 500 });
    }
}
