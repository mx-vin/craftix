"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.GET = GET;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const reviveDates_1 = require("../../../utilities/reviveDates");
const db_1 = __importDefault(require("../../../utilities/db"));
async function OPTIONS() {
    return server_1.NextResponse.json({}, { headers: cors_1.corsHeaders });
}
async function GET() {
    try {
        const rows = await (0, db_1.default) `
      SELECT
        id::text        AS "id",
        user_id::text   AS "userId",
        content,
        image_uri       AS "imageUri",
        is_sensitive    AS "isSensitive",
        has_offensive_text AS "hasOffensiveText",
        created_at
      FROM posts
      ORDER BY created_at DESC
    `;
        const posts = (0, reviveDates_1.reviveDates)(rows);
        return server_1.NextResponse.json(posts, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error fetching all posts:", err);
        return server_1.NextResponse.json({ error: "Failed to fetch all posts" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
