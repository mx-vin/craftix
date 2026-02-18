import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// In these routes, we must match the field definitions in
// the original backend.  This means we have to rename some 
// fields (named differently in the new db schema) to match.
// We also have to return fields that don't exist in the new
// schema (imageId) as null, and we have to return password_hash
// (which we don't store) as null to avoid breaking the frontend.
// We also have to coerce some types (role and id) to string
// to match the original backend.


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

export async function GET() {
  try {
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
    `;

    // Redact password_hash values to avoid leaking hashes; delete this map if you must return the stored password_hash.
    const data = rows.map(u => ({ ...u, password_hash: null }));

    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500, headers: corsHeaders }
    );
  }
}