"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    if (!tag || tag.trim() === "") {
        return server_1.NextResponse.json({ success: false, message: "Missing or empty 'tag' query parameter." }, { status: 400, headers: cors_1.corsHeaders });
    }
    const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
    try {
        const rows = await (0, db_1.default) `
      SELECT
        p.id::text           AS "id",
        p.content            AS "content",
        p.created_at         AS "created_at",
        u.username           AS "username",
        u.profile_image      AS "profile_image",
        h.tag                AS "hashtag"
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags h ON pt.tag_id = h.id
      JOIN users u ON p.user_id = u.id
      WHERE h.tag = ${normalizedTag}
      ORDER BY p.created_at DESC
    `;
        return server_1.NextResponse.json({
            success: true,
            hashtag: normalizedTag,
            count: rows.length,
            posts: rows,
        });
    }
    catch (error) {
        console.error("Error fetching posts by tag:", error);
        return server_1.NextResponse.json({ success: false, message: "Failed to fetch posts by tag." }, { status: 500, headers: cors_1.corsHeaders });
    }
}
