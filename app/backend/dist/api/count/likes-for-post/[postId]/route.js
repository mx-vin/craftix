"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../../utilities/db"));
async function GET(_req, { params }) {
    const { postId } = params;
    try {
        const rows = await (0, db_1.default) `
      SELECT COUNT(*)::int AS count
      FROM post_likes
      WHERE post_id = ${postId}
    `;
        return server_1.NextResponse.json({
            postId,
            likes: rows[0]?.count ?? 0,
        });
    }
    catch (err) {
        console.error("likes-for-post error:", err);
        return server_1.NextResponse.json({ error: "Failed to count likes" }, { status: 500 });
    }
}
