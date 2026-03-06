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
        const { formulaId, gameId, tag } = body;
        if (!formulaId || !tag) {
            return server_1.NextResponse.json({ message: "formulaId and tag are required" }, { status: 400 });
        }
        // Insert new tag
        const rows = await (0, db_1.default) `
      INSERT INTO formula_tags (formula_id, game_id, tag)
      VALUES (${formulaId}, ${gameId ?? null}, ${tag})
      RETURNING id, formula_id, game_id, tag
    `;
        const newTag = rows[0];
        return server_1.NextResponse.json(newTag, { status: 201 });
    }
    catch (err) {
        console.error("createHashtag error:", err);
        return server_1.NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
    }
}
