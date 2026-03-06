"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.PUT = PUT;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
// Preflight CORS
async function OPTIONS() {
    return new server_1.NextResponse(null, { status: 200, headers: cors_1.corsHeaders });
}
// PUT /api/update-bio/[id]
// Expects JSON body: { biography: string }
async function PUT(req, ctx) {
    try {
        const { id } = await ctx.params;
        // Validate UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return server_1.NextResponse.json({ error: "Invalid user id" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const body = await req.json();
        const { biography } = body ?? {};
        if (typeof biography !== "string") {
            return server_1.NextResponse.json({ message: "Invalid biography" }, { status: 400, headers: cors_1.corsHeaders });
        }
        // Update user biography
        const rows = await (0, db_1.default) `
      UPDATE users
      SET biography = ${biography}
      WHERE id = ${id}::uuid
      RETURNING COALESCE(biography, '') AS biography
    `;
        if (rows.length === 0) {
            return server_1.NextResponse.json({ message: "User not found" }, { status: 404, headers: cors_1.corsHeaders });
        }
        return server_1.NextResponse.json({ biography: rows[0].biography }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error updating biography:", error);
        return server_1.NextResponse.json({ message: "Error updating biography", error: String(error?.message ?? error) }, { status: 500, headers: cors_1.corsHeaders });
    }
}
