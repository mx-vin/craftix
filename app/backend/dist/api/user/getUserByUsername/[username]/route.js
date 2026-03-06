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
// Handle preflight requests (CORS)
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(_req, ctx) {
    const { username } = await ctx.params;
    const defaultProfileImageUrl = "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";
    if (!username) {
        return server_1.NextResponse.json({ error: "Username is required" }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        const rows = await (0, db_1.default) `
      SELECT
        user_id::text            AS "id",
        username,
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;
        if (!rows.length) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        const user = rows[0];
        return server_1.NextResponse.json({
            id: user.id,
            username: user.username,
            biography: user.biography,
            profileImage: user.profileImage || defaultProfileImageUrl,
        }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching user by username:", error);
        return server_1.NextResponse.json({ message: "Failed to fetch user", error: error?.message ?? error }, { status: 500, headers: cors_1.corsHeaders });
    }
}
