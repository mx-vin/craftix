import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const { variables } = body;

    if (!variables?.length) {
      return NextResponse.json({ error: "No variables provided" }, { status: 400, headers: corsHeaders });
    }

    // Update each variable
    await Promise.all(
      variables.map(v =>
        sql`
          UPDATE formula_variables
          SET name = COALESCE(${v.name}, name),
              type = COALESCE(${v.type}, type)
          WHERE formula_id = ${id}::uuid AND id = ${v.id}
        `
      )
    );

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Update formula error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}