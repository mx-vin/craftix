import { NextRequest, NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await sql`
      DELETE FROM formulas
      WHERE id = ${id}::uuid
      RETURNING id, name
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: "Formula not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, deleted },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete formula error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}