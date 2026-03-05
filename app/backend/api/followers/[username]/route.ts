import { NextResponse } from "next/server";
import sql from "@/utilities/db";

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    const rows = await sql`
      SELECT
        u.id,
        u.username
      FROM followers f
      JOIN users target
        ON target.id = f.following_id
      JOIN users u
        ON u.id = f.follower_id
      WHERE target.username = ${username}
      ORDER BY f.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
