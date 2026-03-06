"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = __importDefault(require("../../utilities/db"));
const cors_1 = require("../../utilities/cors");
async function GET() {
    try {
        const rows = await (0, db_1.default) `
      SELECT * FROM followers
      ORDER BY created_at DESC
    `;
        return server_1.NextResponse.json(rows, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Error fetching following relationships:", err);
        return server_1.NextResponse.json({ message: "Server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
