"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
const cors_1 = require("../../../utilities/cors");
// UUID validation helper
const isUuid = (val) => /^[0-9a-fA-F-]{36}$/.test(val);
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    try {
        const { postId } = await ctx.params;
        if (!isUuid(postId)) {
            return server_1.NextResponse.json({ error: "Invalid postId" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const [row] = await (0, db_1.default) `
      SELECT COUNT(*)::int AS viewCount
      FROM views
      WHERE post_id = ${postId}::uuid
    `;
        return server_1.NextResponse.json({ viewCount: row?.viewcount ?? 0 }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching view count:", error);
        return server_1.NextResponse.json({ error: "Server error fetching view count", details: error.message }, { status: 500, headers: cors_1.corsHeaders });
    }
}
