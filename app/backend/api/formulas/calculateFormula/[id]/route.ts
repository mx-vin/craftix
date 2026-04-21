import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

type GraphNode = {
  id: string;
  label: string;
  quantity?: number | string;
  x?: number;
  y?: number;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
};

type FormulaData = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  inputs?: { item: string; quantity?: number }[];
  outputs?: { item: string; quantity?: number }[];
  [key: string]: any;
};

type FormulaRow = {
  id: string;
  name: string;
  description: string | null;
  data: FormulaData | null;
};

function toPositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildIncomingMap(nodes: GraphNode[], edges: GraphEdge[]) {
  const incoming = new Map<string, GraphEdge[]>();
  for (const node of nodes) incoming.set(node.id, []);
  for (const edge of edges) {
    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to)!.push(edge);
  }
  return incoming;
}

function buildOutgoingMap(nodes: GraphNode[], edges: GraphEdge[]) {
  const outgoing = new Map<string, GraphEdge[]>();
  for (const node of nodes) outgoing.set(node.id, []);
  for (const edge of edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from)!.push(edge);
  }
  return outgoing;
}

function topoSort(nodes: GraphNode[], edges: GraphEdge[]) {
  const incomingCount = new Map<string, number>();
  const outgoing = buildOutgoingMap(nodes, edges);

  for (const node of nodes) incomingCount.set(node.id, 0);
  for (const edge of edges) {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
  }

  const queue: string[] = [];
  for (const node of nodes) {
    if ((incomingCount.get(node.id) || 0) === 0) queue.push(node.id);
  }

  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);

    for (const edge of outgoing.get(current) || []) {
      const next = edge.to;
      incomingCount.set(next, (incomingCount.get(next) || 0) - 1);
      if ((incomingCount.get(next) || 0) === 0) queue.push(next);
    }
  }

  return ordered;
}

function calculateGraphFormula(
  nodes: GraphNode[],
  edges: GraphEdge[],
  overrides: Record<string, number>
) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const incoming = buildIncomingMap(nodes, edges);
  const outgoing = buildOutgoingMap(nodes, edges);
  const ordered = topoSort(nodes, edges);

  if (ordered.length !== nodes.length) {
    throw new Error("Formula graph contains a cycle");
  }

  const sourceNodes = nodes.filter((n) => (incoming.get(n.id) || []).length === 0);
  const sinkNodes = nodes.filter((n) => (outgoing.get(n.id) || []).length === 0);

  if (sourceNodes.length === 0 || sinkNodes.length === 0) {
    throw new Error("Formula graph must have at least one source node and one sink node");
  }

  // Determine full-batch scale from source overrides
  let scale = Infinity;

  for (const source of sourceNodes) {
    const baseQty = toPositiveNumber(source.quantity);
    const overrideValue = overrides[source.label];

    if (overrideValue !== undefined) {
      const factor = Math.floor(overrideValue / baseQty);
      if (factor < scale) scale = factor;
    }
  }

  if (!Number.isFinite(scale)) {
    scale = 1;
  }

  if (scale < 0) scale = 0;

  // Node values hold the scaled amount represented by each node
  const nodeValues: Record<string, number> = {};
  const used: Record<string, number> = {};
  const results: Record<string, number> = {};

  // Sources are directly scaled
  for (const source of sourceNodes) {
    const qty = toPositiveNumber(source.quantity) * scale;
    nodeValues[source.id] = qty;
    used[source.label] = qty;
  }

  // Process downstream nodes
  for (const nodeId of ordered) {
    const node = nodeById.get(nodeId)!;
    const incomingEdges = incoming.get(nodeId) || [];

    if (incomingEdges.length === 0) continue;

    const nodeBaseQty = toPositiveNumber(node.quantity);

    // For a node to be producible, every parent must be available.
    // Each incoming parent contributes batches based on parent amount / parent base quantity.
    let possibleBatches = Infinity;

    for (const edge of incomingEdges) {
      const parent = nodeById.get(edge.from)!;
      const parentValue = nodeValues[parent.id] ?? 0;
      const parentBaseQty = toPositiveNumber(parent.quantity);

      const parentBatches = Math.floor(parentValue / parentBaseQty);
      if (parentBatches < possibleBatches) {
        possibleBatches = parentBatches;
      }
    }

    if (!Number.isFinite(possibleBatches) || possibleBatches < 0) {
      possibleBatches = 0;
    }

    nodeValues[node.id] = possibleBatches * nodeBaseQty;
  }

  for (const sink of sinkNodes) {
    results[sink.label] = nodeValues[sink.id] ?? 0;
  }

  return {
    scale,
    used,
    results,
    nodeValues,
    sourceNodes: sourceNodes.map((n) => n.label),
    sinkNodes: sinkNodes.map((n) => n.label),
  };
}

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

    const rows = await sql<FormulaRow[]>`
      SELECT id, name, description, data
      FROM formulas
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const formula = rows[0];

    if (!formula) {
      return NextResponse.json(
        { error: "Formula not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const nodes = Array.isArray(formula.data?.nodes) ? formula.data!.nodes! : [];
    const edges = Array.isArray(formula.data?.edges) ? formula.data!.edges! : [];

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "Formula has no graph nodes" },
        { status: 400, headers: corsHeaders }
      );
    }

    const calculation = calculateGraphFormula(nodes, edges, overrides);

    return NextResponse.json(
      {
        success: true,
        used: calculation.used,
        results: calculation.results,
        nodeValues: calculation.nodeValues,
        sourceNodes: calculation.sourceNodes,
        sinkNodes: calculation.sinkNodes,
        scale: calculation.scale,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Calculate formula error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        message: err?.message || String(err),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}