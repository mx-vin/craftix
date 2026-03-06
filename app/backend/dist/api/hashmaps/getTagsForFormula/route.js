"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.OPTIONS = OPTIONS;
const server_1 = require("next/server");
const cors_1 = require("../../../utilities/cors");
const db_1 = __importDefault(require("../../../utilities/db"));
// GET /api/hashmaps/formula/getTagsForFormula/:formula_id
async function GET(_req, ctx) {
    try {
        const { formula_id } = await ctx.params;
        const rows = await (0, db_1.default) `
      SELECT tag FROM formula_tags WHERE formula_id = ${formula_id} ORDER BY tag
    `;
        const tags = rows.map((r) => r.tag);
        return server_1.NextResponse.json(tags, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error fetching formula tags:", error);
        return server_1.NextResponse.json({ error: "Failed to fetch formula tags" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
async function OPTIONS() {
    return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
}
