import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

const defaultProfileImageUrl =
  "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [user] = await sql<{
      id: string;
      username: string;
      profileImage: string | null;
      biography: string;
    }[]>`
      SELECT
        id::text AS "id",
        username,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage || defaultProfileImageUrl,
        biography: user.biography,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error fetching user by username:", err);
    return NextResponse.json(
      { message: "Failed to fetch user", error: err.message || err },
      { status: 500, headers: corsHeaders }
    );
  }
}