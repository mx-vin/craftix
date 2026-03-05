import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  date: string | Date;
  role: string;
  profileImage: string | null;
  biography: string;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const rows = await sql<ApiUser[]>`
      SELECT
        id::text,
        username,
        email,
        password_hash,
        created_at AS date,
        role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography
      FROM users
    `;

    const data = rows.map(u => ({ ...u, password_hash: null }));
    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500, headers: corsHeaders });
  }
}
