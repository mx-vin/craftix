import { NextResponse } from "next/server";
import sql from "@/utilities/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Missing username query parameter" },
      { status: 400 }
    );
  }

  try {
    const rows = await sql`
      SELECT
        u.id,
        u.username
      FROM followers f
      JOIN users me
        ON me.id = f.follower_id
      JOIN users u
        ON u.id = f.following_id
      WHERE me.username = ${username}
      ORDER BY f.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch following list" },
      { status: 500 }
    );
  }
}
