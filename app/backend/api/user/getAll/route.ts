import { NextResponse } from "next/server";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

// Define the type to match your updated users table
type ApiUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  role: boolean;           // corresponds to is_admin
  profileImage: string | null;
  biography: string;
  date: string | Date;     // created_at
};

// Handle preflight requests
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
        is_admin AS role,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography,
        created_at AS "date"
      FROM users
      ORDER BY created_at DESC
    `;

    // redact passwords
    const data = rows.map(u => ({ ...u, password_hash: null }));

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500, headers: corsHeaders });
  }
}