import { NextResponse } from "next/server";
import sql from "../../../utilities/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formulaId, gameId, tag } = body;

    if (!formulaId || !tag) {
      return NextResponse.json(
        { message: "formulaId and tag are required" },
        { status: 400 }
      );
    }

    // Insert new tag
    const rows = await sql`
      INSERT INTO formula_tags (formula_id, game_id, tag)
      VALUES (${formulaId}, ${gameId ?? null}, ${tag})
      RETURNING id, formula_id, game_id, tag
    `;

    const newTag = rows[0];

    return NextResponse.json(newTag, { status: 201 });
  } catch (err: any) {
    console.error("createHashtag error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
