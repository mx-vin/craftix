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
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const postId = searchParams.get("postId");
    if (!userId && !postId) {
        return server_1.NextResponse.json({ message: "Missing userId or postId" }, { status: 400, headers: cors_1.corsHeaders });
    }
    let rows;
    if (postId) {
        rows = await (0, db_1.default) `
      SELECT image_uri
      FROM post_images
      WHERE post_id = ${postId}
      ORDER BY created_at DESC
    `;
    }
    else {
        rows = await (0, db_1.default) `
      SELECT profile_image
      FROM users
      WHERE id = ${userId}
    `;
    }
    return server_1.NextResponse.json(rows, { status: 200, headers: cors_1.corsHeaders });
}
