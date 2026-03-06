"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.POST = POST;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
const cors_1 = require("../../../utilities/cors");
const isUuid = (val) => /^[0-9a-fA-F-]{36}$/.test(val);
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
async function POST(req) {
    try {
        const { userId, postId } = await req.json();
        if (!isUuid(userId) || !isUuid(postId)) {
            return server_1.NextResponse.json({ error: "Invalid userId or postId" }, { status: 400, headers: cors_1.corsHeaders });
        }
        // Only insert if it doesn't exist already
        const existing = await (0, db_1.default) `
      SELECT 1 FROM views WHERE user_id = ${userId}::uuid AND post_id = ${postId}::uuid
    `;
        if (existing.length === 0) {
            await (0, db_1.default) `
        INSERT INTO views (user_id, post_id)
        VALUES (${userId}::uuid, ${postId}::uuid)
      `;
        }
        // Mimic Mongo behavior: 200 OK, no body
        return new Response(null, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error adding view:", error);
        return server_1.NextResponse.json({ error: "Failed to add view", details: error.message }, { status: 500, headers: cors_1.corsHeaders });
    }
}
