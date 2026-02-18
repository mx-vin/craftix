import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Request body:
// {
//   "formula_id": "uuid",
//   "tags": ["#Alchemy", "Physics"]
// }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formula_id, tags } = body;

    if (!formula_id || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: formula_id and non-empty tags array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify formula exists
    const formulaCheck = await sql`SELECT id FROM formulas WHERE id = ${formula_id}`;
    if (formulaCheck.length === 0) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404, headers: corsHeaders });
    }

    for (let rawTag of tags) {
      if (typeof rawTag !== "string") continue;

      let tag = rawTag.trim();
      if (!tag.startsWith("#")) tag = `#${tag}`;
      if (tag.length === 1) continue;

      if (tag.length > 255) continue;
      const validPattern = /^#[A-Za-z0-9_]+$/;
      if (!validPattern.test(tag)) continue;

      await sql`
        INSERT INTO formula_tags (formula_id, tag)
        VALUES (${formula_id}, ${tag})
        ON CONFLICT (formula_id, tag) DO NOTHING
      `;
    }

    return NextResponse.json(
      { success: true, message: "Tags attached to formula", formula_id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error attaching tags to formula:", error);
    return NextResponse.json(
      { error: "Failed to attach tags to formula" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
