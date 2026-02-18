import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// PUT /api/user/update-bio/[id]
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { biography } = body ?? {};

    if (typeof biography !== "string") {
      return NextResponse.json(
        { message: "Invalid biography" },
        { status: 400, headers: corsHeaders }
      );
    }

const rows = await sql<{ biography: string }[]>`
  UPDATE ssu_users
  SET biography = ${biography}
  WHERE user_id = ${id}::uuid
  RETURNING COALESCE(biography, '') AS biography
`;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { biography: rows[0].biography },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating biography:", error);
    return NextResponse.json(
      { message: "Error updating biography" },
      { status: 500, headers: corsHeaders }
    );
  }
}