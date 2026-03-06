"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.GET = GET;
const server_1 = require("next/server");
const cors_1 = require("../../../../utilities/cors");
// This route mirrors the legacy backend: GET /user/search/:searchInput
// It returns an array of user objects with the same field names/types
// as the original API. Password is included as null to preserve shape
// without exposing hashes.
const db_1 = __importDefault(require("../../../../utilities/db"));
// Handle preflight requests (CORS)
async function OPTIONS() {
    return new server_1.NextResponse(null, {
        status: 200,
        headers: cors_1.corsHeaders,
    });
}
async function GET(_req, ctx) {
    try {
        const { searchInput } = await ctx.params;
        // Match legacy behavior: if no search input, return {}
        if (!searchInput) {
            return server_1.NextResponse.json({}, { status: 200, headers: cors_1.corsHeaders });
        }
        const likeTerm = `%${searchInput}%`;
        const rows = await (0, db_1.default) `
      SELECT
        user_id::text            AS "id",
        username                 AS "username",
        email                    AS "email",
        password_hash                 AS "password_hash",
        created_at               AS "date",
        role::text               AS "role",
        NULL::text               AS "imageId",
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE username ILIKE ${likeTerm}
    `;
        // Redact password_hash to avoid leaking stored hashes
        const data = rows.map((u) => ({ ...u, password_hash: null }));
        return server_1.NextResponse.json(data, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (error) {
        console.error("Error searching users:", error);
        return server_1.NextResponse.json({ error: "Internal server error" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
