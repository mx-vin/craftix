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
// POST /api/profile/upload
// Expects: { user_id: string, image_url: string }
async function POST(req) {
    try {
        const body = await req.json();
        const { user_id, image_url } = body;
        if (!user_id) {
            return server_1.NextResponse.json({ message: "user_id is required" }, { status: 400, headers: cors_1.corsHeaders });
        }
        if (!image_url || typeof image_url !== "string" || !image_url.trim()) {
            return server_1.NextResponse.json({ message: "image_url is required" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const isHttpUrl = /^(https?:)\/\//i.test(image_url);
        if (!isHttpUrl) {
            return server_1.NextResponse.json({ message: "image_url must be an http(s) URL" }, { status: 400, headers: cors_1.corsHeaders });
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
        const updated = await (0, db_1.default) `
      UPDATE users
      SET profile_image = ${image_url}
      WHERE id = ${user_id}::uuid
      RETURNING profile_image
    `;
        return server_1.NextResponse.json({ message: "Profile image updated successfully", profileImage: updated?.[0]?.profile_image ?? image_url }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error uploading profile image:", error);
        return server_1.NextResponse.json({ message: "Failed to upload profile image", error: String(error?.message ?? error) }, { status: 500, headers: cors_1.corsHeaders });
    }
}
