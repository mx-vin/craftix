import { NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ searchInput: string }> }) {
  try {
    const { searchInput } = await ctx.params;
    if (!searchInput) return NextResponse.json({}, { status: 200, headers: corsHeaders });

    const likeTerm = `%${searchInput}%`;

    const rows = await sql<{
      id: string; username: string; email: string; profileImage: string | null; biography: string;
    }[]>`
      SELECT
        id::text AS "id",
        username,
        email,
        profile_image AS "profileImage",
        COALESCE(biography,'') AS biography
      FROM users
      WHERE username ILIKE ${likeTerm}
    `;

    return NextResponse.json(rows.map(u => ({ ...u, password_hash: null })), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Error searching users:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}