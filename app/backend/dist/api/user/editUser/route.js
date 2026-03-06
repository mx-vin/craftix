"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.PUT = PUT;
const server_1 = require("next/server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
async function OPTIONS() {
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
async function PUT(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return server_1.NextResponse.json({ success: false, message: "Unauthorized: Missing token" }, { status: 401, headers: cors_1.corsHeaders });
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        }
        catch {
            return server_1.NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401, headers: cors_1.corsHeaders });
        }
        const userId = decoded.id;
        if (!userId)
            return server_1.NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 400, headers: cors_1.corsHeaders });
        const body = await req.json();
        const username = body.username?.trim() || null;
        const email = body.email?.trim() || null;
        const password_hash = body.password_hash?.trim() || null;
        const biography = body.biography?.trim() || null;
        const [existingUser] = await (0, db_1.default) `SELECT * FROM users WHERE id = ${userId}`;
        if (!existingUser)
            return server_1.NextResponse.json({ success: false, message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        if (username) {
            const [conflict] = await (0, db_1.default) `
        SELECT id FROM users
        WHERE LOWER(username) = LOWER(${username}) AND id <> ${userId}
      `;
            if (conflict)
                return server_1.NextResponse.json({ success: false, message: "Username is already taken" }, { status: 409, headers: cors_1.corsHeaders });
        }
        let hashedPassword = existingUser.password_hash;
        if (password_hash) {
            const salt = await bcryptjs_1.default.genSalt(10);
            hashedPassword = await bcryptjs_1.default.hash(password_hash, salt);
        }
        const [updatedUser] = await (0, db_1.default) `
      UPDATE users
      SET
        username = COALESCE(${username}, username),
        email = COALESCE(${email}, email),
        password_hash = ${hashedPassword},
        biography = COALESCE(${biography}, biography)
      WHERE id = ${userId}
      RETURNING id, username, email, biography
    `;
        return server_1.NextResponse.json({ success: true, message: "User updated successfully", user: updatedUser }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return server_1.NextResponse.json({ success: false, message: "Server error while updating user information" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
