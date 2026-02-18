import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  date: string | Date;
  role: string;
  imageId: string | null;
  profileImage: string | null;
  biography: string;
};

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET /api/user/getUserById/[id]
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }   // NOTE: params is a Promise now
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<ApiUser[]>`
      SELECT
        user_id::text            AS "id",
        username                 AS "username",
        email                    AS "email",
        password_hash                 AS "password_hash",
        created_at               AS "date",
        role::text               AS "role",
        NULL::text               AS "imageId",
        profile_image            AS "profileImage",
        COALESCE(biography, '')  AS "biography"
      FROM ssu_users
      WHERE user_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const user = { ...rows[0], password_hash: null }; // redact password_hash
    return NextResponse.json(user, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500, headers: corsHeaders }
    );
  }
}