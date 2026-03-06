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
const defaultProfileImageUrl = "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(req, ctx) {
    const { username } = await ctx.params;
    try {
        if (!username)
            return server_1.NextResponse.json({ success: false, message: "Username is required." }, { status: 400, headers: cors_1.corsHeaders });
        const result = await (0, db_1.default) `
      SELECT profile_image
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
        if (!result.length)
            return server_1.NextResponse.json({ success: false, message: "User not found." }, { status: 404, headers: cors_1.corsHeaders });
        const proxyUrl = new URL(`/api/user/profileImageProxy/${encodeURIComponent(username)}`, req.nextUrl.origin).toString();
        return server_1.NextResponse.json({ success: true, imageUri: proxyUrl }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching profile image:", error);
        return server_1.NextResponse.json({ success: false, message: error.message || "Server error." }, { status: 500, headers: cors_1.corsHeaders });
    }
}
