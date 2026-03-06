"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../../utilities/db"));
async function GET(_req, ctx) {
    try {
        const { username } = await ctx.params;
        if (!username || typeof username !== "string" || !username.trim()) {
            return server_1.NextResponse.json({ message: "username is required." }, { status: 400 });
        }
        const ident = username.trim();
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(ident);
        let rows;
        if (isUuid) {
            // Count likes made by the user (identified by UUID)
            rows = await (0, db_1.default) `
        SELECT COUNT(*)::int AS count
        FROM likes l
        WHERE l.user_id = ${ident}::uuid
      `;
        }
        else {
            // Count likes made by the user (identified by username)
            rows = await (0, db_1.default) `
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN ssu_users u ON u.user_id = l.user_id
        WHERE u.username = ${ident}
      `;
            // If duplicates are possible, use COUNT(DISTINCT l.post_id) instead.
        }
        const likedCount = rows?.[0]?.count ?? 0;
        return server_1.NextResponse.json(likedCount, { status: 200 });
    }
    catch (err) {
        console.error("Error counting likes made by user:", err);
        return server_1.NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
