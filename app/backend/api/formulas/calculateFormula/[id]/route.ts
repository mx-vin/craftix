// app/backend/api/formulas/calculateFormula/[id]/route.ts
import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

// ----------------------
// Core calculation
// ----------------------
function calculateBalancedValues(
  variables: { name: string; type: string; base_value: number }[],
  overrides: Record<string, number>
) {
  const used: Record<string, number> = {};
  const results: Record<string, number> = {};

  // Determine maximum full batches allowed by all overrides
  let scale = Infinity;

  for (const [name, value] of Object.entries(overrides)) {
    const v = variables.find(v => v.name === name);
    if (v) {
      const factor = Math.floor(value / v.base_value);
      if (factor < scale) scale = factor;
    }
  }

  if (!isFinite(scale) || scale < 0) scale = 0;

  // Compute used amounts for all variables
  for (const v of variables) {
    used[v.name] = v.base_value * scale;
    if (v.type.toLowerCase() === "output") {
      results[v.name] = used[v.name];
    }
  }

  return { used, results };
}

// ----------------------
// POST /calculateFormula/:id
// ----------------------
export async function POST(
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
    const overrides: Record<string, number> = body.inputs || {};

    // Fetch all variables for this formula
    const variables = await sql<{ name: string; type: string; base_value: number }[]>`
      SELECT name, type, COALESCE(base_value,1)::int AS base_value
      FROM formula_variables
      WHERE formula_id = ${id}::uuid
    `;

    if (!variables.length) {
      return NextResponse.json(
        { error: "Formula has no variables" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Compute used and results
    const { used, results } = calculateBalancedValues(variables, overrides);

    return NextResponse.json(
      { success: true, used, results },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Calculate formula error:", err);
    return NextResponse.json(
      { error: "Server error", message: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}