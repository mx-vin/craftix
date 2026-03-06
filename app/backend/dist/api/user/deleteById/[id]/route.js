"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = require("../../../../utilities/cors");
const db_1 = __importDefault(require("../../../../utilities/db"));
function verifyToken(req) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
        return null;
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET);
        return payload;
    }
    catch {
        return null;
    }
}
async function OPTIONS() {
    return new server_1.NextResponse(null, { headers: cors_1.corsHeaders });
}
async function DELETE(_req, ctx) {
    try {
        const { id } = await ctx.params;
        const userFromToken = verifyToken(_req);
        if (!userFromToken) {
            return server_1.NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: cors_1.corsHeaders });
        }
        if (userFromToken.id !== id) {
            return server_1.NextResponse.json({ message: "Not authorized to delete this user" }, { status: 403, headers: cors_1.corsHeaders });
        }
        const rows = await (0, db_1.default) `
      DELETE FROM users
      WHERE id = ${id}::uuid
      RETURNING
        id,
        username,
        email,
        password_hash,
        role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS "biography"
    `;
        if (!rows.length)
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        const deletedUser = { ...rows[0], password_hash: null };
        return server_1.NextResponse.json({ message: "User deleted successfully", deletedUser }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Delete user error:", error);
        return server_1.NextResponse.json({ message: "Internal server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
