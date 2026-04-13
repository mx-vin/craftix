import { NextRequest, NextResponse } from "next/server";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { message: "Username is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const rows = await sql`
      SELECT u.id, u.username, u.email, u.is_admin, u.created_at
      FROM followers f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = (SELECT id FROM users WHERE username = ${username})
      ORDER BY f.created_at DESC
    `;

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error fetching following list:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}