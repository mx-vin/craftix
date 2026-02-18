import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// GET /api/hashmaps/post/getTagsForPost/:post_id
export async function GET(_req: Request, ctx: { params: Promise<{ post_id: string }> }) {
  try {
    const { post_id } = await ctx.params;

    const rows = await sql<{ tag: string }[]>`
      SELECT tag FROM post_tags WHERE post_id = ${post_id} ORDER BY tag
    `;

    const tags = rows.map((r) => r.tag);
    return NextResponse.json(tags, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching post tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch post tags" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
