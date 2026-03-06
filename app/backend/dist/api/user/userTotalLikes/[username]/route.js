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
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    try {
        const { username } = await ctx.params;
        if (!username || typeof username !== "string" || !username.trim()) {
            return server_1.NextResponse.json({ message: "username is required." }, { status: 400, headers: cors_1.corsHeaders });
        }
        const ident = username.trim();
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(ident);
        let rows;
        if (isUuid) {
            rows = await (0, db_1.default) `
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN posts p ON p.post_id = l.post_id
        WHERE p.user_id = ${ident}::uuid
      `;
        }
        else {
            rows = await (0, db_1.default) `
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN posts p ON p.post_id = l.post_id
        JOIN ssu_users u ON u.user_id = p.user_id
        WHERE u.username = ${ident}
      `;
        }
        const totalLikes = rows?.[0]?.count ?? 0;
        return server_1.NextResponse.json(totalLikes, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error counting total likes for user:", err);
        return server_1.NextResponse.json({ message: "Internal Server Error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
