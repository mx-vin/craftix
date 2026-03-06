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
async function OPTIONS() {
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
async function GET() {
    try {
        const rows = await (0, db_1.default) `
      SELECT
        id::text,
        username,
        email,
        password_hash,
        created_at AS date,
        role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography
      FROM users
    `;
        const data = rows.map(u => ({ ...u, password_hash: null }));
        return server_1.NextResponse.json(data, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return server_1.NextResponse.json({ error: "Failed to fetch users" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
