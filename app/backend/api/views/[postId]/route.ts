import { NextResponse } from "next/server";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

// UUID validation helper
const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await ctx.params;

    if (!isUuid(postId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400, headers: corsHeaders });
    }

    const [row] = await sql<{ viewcount: number }[]>`
      SELECT COUNT(*)::int AS viewCount
      FROM views
      WHERE post_id = ${postId}::uuid
    `;

    return NextResponse.json(
      { viewCount: row?.viewcount ?? 0 },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { error: "Server error fetching view count", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
