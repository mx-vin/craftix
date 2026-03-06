"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.OPTIONS = OPTIONS;
const server_1 = require("next/server");
const cors_1 = require("../../../../utilities/cors");
const db_1 = __importDefault(require("../../../../utilities/db"));
const defaultProfileImageUrl = "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";
async function fetchImageArrayBuffer(url) {
    try {
        const upstream = await fetch(url, { cache: "no-store" });
        if (!upstream.ok)
            return null;
        const contentType = upstream.headers.get("content-type") || "image/png";
        const body = await upstream.arrayBuffer();
        return { body, contentType };
    }
    catch {
        return null;
    }
}
// GET /api/user/profileImageProxy/:username
async function GET(_req, context) {
    const { username } = await context.params;
    if (!username) {
        return server_1.NextResponse.json({ message: "Username is required." }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        const rows = await (0, db_1.default) `
      SELECT profile_image
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;
        const candidateUrl = rows?.[0]?.profile_image || defaultProfileImageUrl;
        // Try the user's image first, then fall back to default
        const primary = await fetchImageArrayBuffer(candidateUrl);
        const chosen = primary ?? (await fetchImageArrayBuffer(defaultProfileImageUrl));
        if (!chosen) {
            return server_1.NextResponse.json({ message: "Image fetch failed." }, { status: 502, headers: cors_1.corsHeaders });
        }
        return new server_1.NextResponse(chosen.body, {
            status: 200,
            headers: {
                ...cors_1.corsHeaders,
                "Content-Type": chosen.contentType,
                "Cache-Control": "public, max-age=300",
            },
        });
    }
    catch (error) {
        return server_1.NextResponse.json({ message: error?.message || "Server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
