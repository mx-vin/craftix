"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.POST = POST;
// @/app/api/user/refresh-token/route.ts
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../utilities/db"));
const cors_1 = require("../../utilities/cors");
const generateToken_1 = require("../../utilities/generateToken");
// Handle preflight OPTIONS
async function OPTIONS() {
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
// POST /api/user/refresh-token
async function POST(req) {
    try {
        const body = await req.json();
        const { id, email, username, role } = body;
        if (!id || !email || !username || !role) {
            return server_1.NextResponse.json({ message: "Missing required fields" }, { status: 400, headers: cors_1.corsHeaders });
        }
        // Optionally, check that user exists in DB
        const rows = await (0, db_1.default) `
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
        if (rows.length === 0) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        // ✅ Generate new tokens — THIS is where the const line goes
        const newAccessToken = (0, generateToken_1.generateAccessToken)({
            id,
            email,
            username,
            isAdmin: role === "admin", // matches your generateToken type
        });
        const newRefreshToken = (0, generateToken_1.generateRefreshToken)({
            id,
            email,
            username,
            isAdmin: role === "admin",
        });
        return server_1.NextResponse.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Refresh token error:", err);
        return server_1.NextResponse.json({ message: "Server error", error: err.message }, { status: 500, headers: cors_1.corsHeaders });
    }
}
