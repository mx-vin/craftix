import { NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: string;
  profileImage: string | null;
  biography: string;
  created_at: string | Date;
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<ApiUser[]>`
      SELECT
        id::text,
        username,
        email,
        password_hash,
        role::text AS role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography,
        created_at
      FROM users
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const user = { ...rows[0], password_hash: null }; // redact password hash

    return NextResponse.json(user, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error fetching user by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch user", error: error?.message ?? error },
      { status: 500, headers: corsHeaders }
    );
  }
}
