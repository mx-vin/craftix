import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

type ApiUser = {
  id: string;
  username: string;
  profileImage: string | null;
  biography: string;
};

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  const { username } = await ctx.params;

  const defaultProfileImageUrl =
    "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const rows = await sql<ApiUser[]>`
      SELECT
        user_id::text            AS "id",
        username,
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const user = rows[0];

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        biography: user.biography,
        profileImage: user.profileImage || defaultProfileImageUrl,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error fetching user by username:", error);
    return NextResponse.json(
      { message: "Failed to fetch user", error: error?.message ?? error },
      { status: 500, headers: corsHeaders }
    );
  }
}
