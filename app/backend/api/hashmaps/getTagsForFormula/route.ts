import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// GET /api/hashmaps/formula/getTagsForFormula/:formula_id
export async function GET(_req: Request, ctx: { params: Promise<{ formula_id: string }> }) {
  try {
    const { formula_id } = await ctx.params;

    const rows = await sql<{ tag: string }[]>`
      SELECT tag FROM formula_tags WHERE formula_id = ${formula_id} ORDER BY tag
    `;

    const tags = rows.map((r) => r.tag);
    return NextResponse.json(tags, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching formula tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch formula tags" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
