"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.OPTIONS = OPTIONS;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
// Request body:
// {
//   "post_id": "uuid",
//   "tags": ["#Community", "#Physics"]
// }
async function POST(req) {
    try {
        const body = await req.json();
        const { post_id, tags } = body;
        if (!post_id || !Array.isArray(tags) || tags.length === 0) {
            return server_1.NextResponse.json({ error: "Missing required fields: post_id and non-empty tags array" }, { status: 400, headers: cors_1.corsHeaders });
        }
        // Verify post exists
        const postCheck = await (0, db_1.default) `SELECT id FROM posts WHERE id = ${post_id}`;
        if (postCheck.length === 0) {
            return server_1.NextResponse.json({ error: "Post not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        for (let rawTag of tags) {
            if (typeof rawTag !== "string")
                continue;
            let tag = rawTag.trim();
            if (!tag.startsWith("#"))
                tag = `#${tag}`;
            if (tag.length === 1)
                continue;
            if (tag.length > 255)
                continue;
            const validPattern = /^#[A-Za-z0-9_]+$/;
            if (!validPattern.test(tag))
                continue;
            await (0, db_1.default) `
        INSERT INTO post_tags (post_id, tag)
        VALUES (${post_id}, ${tag})
        ON CONFLICT (post_id, tag) DO NOTHING
      `;
        }
        return server_1.NextResponse.json({ success: true, message: "Tags attached to post", post_id }, { status: 201, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error attaching tags to post:", error);
        return server_1.NextResponse.json({ error: "Failed to attach tags to post" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
