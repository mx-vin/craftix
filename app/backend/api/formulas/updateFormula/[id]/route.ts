import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: "Formula ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { name, description, folder_id, data, variables } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Formula name is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const validTypes = ["input", "output"];
    if (!Array.isArray(variables) || variables.length === 0) {
      return NextResponse.json(
        { error: "At least one variable is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    for (const v of variables) {
      if (!validTypes.includes(v.type)) {
        return NextResponse.json(
          { error: `Invalid variable type: ${v.type}` },
          { status: 400, headers: corsHeaders }
        );
      }
      if (!v.name || v.name.trim() === "") {
        return NextResponse.json(
          { error: "Variable name is required" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const inputs = variables.filter(v => v.type === "input");
    const outputs = variables.filter(v => v.type === "output");

    if (inputs.length === 0 || outputs.length === 0) {
      return NextResponse.json(
        { error: "Formula must have at least one input and one output" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update main formula
    await sql`
      UPDATE formulas
      SET name = ${name}, description = ${description ?? null},
          folder_id = ${folder_id ?? null}, data = ${data ?? null}, updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    const keepIds: string[] = [];

    // Upsert variables
    for (const v of variables) {
      if (v.id) {
        keepIds.push(v.id);
        await sql`
          UPDATE formula_variables
          SET name = ${v.name}, type = ${v.type}, base_value = ${v.base_value ?? 1}
          WHERE id = ${v.id}::uuid AND formula_id = ${id}::uuid
        `;
      } else {
        const [inserted] = await sql`
          INSERT INTO formula_variables (formula_id, name, type, base_value)
          VALUES (${id}::uuid, ${v.name}, ${v.type}, ${v.base_value ?? 1})
          RETURNING id
        `;
        keepIds.push(inserted.id);
      }
    }

    // Delete removed variables (fixed array interpolation)
    if (keepIds.length > 0) {
      await sql`
        DELETE FROM formula_variables
        WHERE formula_id = ${id}::uuid
          AND id != ALL(${keepIds.map(k => k)}::uuid[])
      `;
    } else {
      await sql`
        DELETE FROM formula_variables WHERE formula_id = ${id}::uuid
      `;
    }

    // Fetch updated data
    const [formula] = await sql`SELECT * FROM formulas WHERE id = ${id}::uuid`;
    const updatedVariables = await sql`SELECT * FROM formula_variables WHERE formula_id = ${id}::uuid`;
    const links = await sql`SELECT * FROM formula_links WHERE from_formula_id = ${id}::uuid`;

    return NextResponse.json(
      { success: true, formula, variables: updatedVariables, links },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Update formula error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}