import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function PUT(
  req: NextRequest,
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

    const body = await req.json();
    const { biography } = body ?? {};

    if (typeof biography !== "string") {
      return NextResponse.json(
        { message: "Invalid biography" },
        { status: 400, headers: corsHeaders }
      );
    }

    const rows = await sql<{ biography: string }[]>`
      UPDATE users
      SET biography = ${biography}
      WHERE id = ${id}::uuid
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
  } catch (error: any) {
    console.error("Error updating biography:", error);
    return NextResponse.json(
      { message: "Error updating biography", error: String(error?.message ?? error) },
      { status: 500, headers: corsHeaders }
    );
  }
}