"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = DELETE;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
const cors_1 = require("../../../utilities/cors");
async function DELETE(req) {
    const { postId, userId } = await req.json();
    if (!postId || !userId) {
        return server_1.NextResponse.json({ message: "Missing postId or userId" }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        await (0, db_1.default) `
      DELETE FROM post_likes
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;
        return server_1.NextResponse.json({ message: "Post unliked" }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Unlike error:", error);
        return server_1.NextResponse.json({ message: "Server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
