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
// Handle preflight requests
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    try {
        const { id } = await ctx.params;
        // Validate UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return server_1.NextResponse.json({ error: "Invalid user id" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const rows = await (0, db_1.default) `
      SELECT
        id::text,
        username,
        email,
        password_hash,
        role::text AS role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography,
        created_at
      FROM users
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
        if (!rows.length) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        const user = { ...rows[0], password_hash: null }; // redact password hash
        return server_1.NextResponse.json(user, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching user by ID:", error);
        return server_1.NextResponse.json({ message: "Failed to fetch user", error: error?.message ?? error }, { status: 500, headers: cors_1.corsHeaders });
    }
}
