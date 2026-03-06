"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.POST = POST;
// ssu-@/app/@/app/api/user/refresh-token/route.ts
const server_1 = require("next/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken_1 = require("../../../utilities/generateToken");
const cors_1 = require("../../../utilities/cors");
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
    }
    catch (err) {
        throw new Error("Invalid or expired refresh token");
    }
};
async function OPTIONS() {
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
async function POST(req) {
    try {
        const body = await req.json();
        const { refreshToken } = body;
        if (!refreshToken) {
            return server_1.NextResponse.json({ message: "No refresh token provided" }, { status: 401, headers: cors_1.corsHeaders });
        }
        const decoded = verifyRefreshToken(refreshToken);
        const { id, email, username, role } = decoded;
        const isAdmin = role === "admin";
        // ✅ Correct token generation
        const newAccessToken = (0, generateToken_1.generateAccessToken)({
            id,
            email: email,
            username: username,
            isAdmin,
        });
        const newRefreshToken = (0, generateToken_1.generateRefreshToken)({
            id,
            email: email,
            username: username,
            isAdmin,
        });
        return server_1.NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        return server_1.NextResponse.json({ message: err.message }, { status: 403, headers: cors_1.corsHeaders });
    }
}
