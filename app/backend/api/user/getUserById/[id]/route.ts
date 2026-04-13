import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: boolean;
  profileImage: string | null;
  biography: string;
  created_at: string | Date;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        is_admin AS role,
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

    const user = { ...rows[0], password_hash: null };

    return NextResponse.json(user, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error fetching user by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch user", error: error?.message ?? error },
      { status: 500, headers: corsHeaders }
    );
  }
}