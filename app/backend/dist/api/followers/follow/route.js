"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../../utilities/db"));
async function POST(req) {
    try {
        const body = await req.json();
        const { followerId, followingId } = body;
        if (!followerId || !followingId) {
            return server_1.NextResponse.json({ error: "Missing followerId or followingId" }, { status: 400 });
        }
        if (followerId === followingId) {
            return server_1.NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }
        await (0, db_1.default) `
      INSERT INTO followers (follower_id, following_id)
      VALUES (${followerId}, ${followingId})
      ON CONFLICT DO NOTHING
    `;
        return server_1.NextResponse.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return server_1.NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
    }
}
