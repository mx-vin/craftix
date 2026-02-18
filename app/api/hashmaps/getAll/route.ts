import { NextResponse } from "next/server";
import sql from "@/utilities/db";

export async function GET(req: Request) {
  try {
    // Fetch all tags from the formula_tags table
    const rows = await sql`
      SELECT
        id,
        formula_id,
        game_id,
        tag
      FROM formula_tags
      ORDER BY tag ASC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("getAll hashmaps error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
