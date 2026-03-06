"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.POST = POST;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
// Preflight for CORS
async function OPTIONS() {
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
// POST /api/profile/remove
// Expects: { user_id: string }
async function POST(req) {
    try {
        const body = await req.json();
        const { user_id } = body;
        if (!user_id) {
            return server_1.NextResponse.json({ message: "user_id is required" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const userRows = await (0, db_1.default) `
      SELECT id::text, profile_image
      FROM users
      WHERE id = ${user_id}::uuid
      LIMIT 1
    `;
        if (userRows.length === 0) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        const DEFAULT_PROFILE_IMAGE = "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";
        await (0, db_1.default) `
      UPDATE users
      SET profile_image = ${DEFAULT_PROFILE_IMAGE}
      WHERE id = ${user_id}::uuid
    `;
        return server_1.NextResponse.json({ message: "Profile image removed successfully", profileImage: DEFAULT_PROFILE_IMAGE }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error removing profile image:", error);
        return server_1.NextResponse.json({ message: "Failed to remove profile image", error: String(error?.message ?? error) }, { status: 500, headers: cors_1.corsHeaders });
    }
}
