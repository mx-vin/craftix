"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./builder.module.css";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
};

type FormulaVariable = {
  id: string;
  formula_id: string;
  name: string;
  type: string;
  base_value: number;
};

type BuilderNode = {
  id: string;
  label: string;
  quantity: number;
  x: number;
  y: number;
};

type BuilderEdge = {
  id: string;
  from: string;
  to: string;
};

type FormulaData = {
  inputs?: { item: string; quantity?: number }[];
  outputs?: { item: string; quantity?: number }[];
  nodes?: BuilderNode[];
  edges?: BuilderEdge[];
  [key: string]: any;
};

type FormulaRecord = {
  id: string;
  user_id?: string;
  folder_id?: string | null;
  name: string;
  description: string | null;
  data: FormulaData | null;
  created_at?: string;
  updated_at?: string;
};

type GetFormulaResponse = {
  formula?: FormulaRecord;
  variables?: FormulaVariable[];
  links?: unknown[];
  error?: string;
  message?: string;
  success?: boolean;
};

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
} | null;

function makeNodeId() {
  return `node-${crypto.randomUUID()}`;
}

function makeEdgeId() {
  return `edge-${crypto.randomUUID()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function BuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");
  const [formulaId, setFormulaId] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFormula, setLoadingFormula] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [formula, setFormula] = useState<FormulaRecord | null>(null);

  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [edges, setEdges] = useState<BuilderEdge[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);

  const [connectMode, setConnectMode] = useState(false);
  const [pendingConnectionFrom, setPendingConnectionFrom] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (!rawToken || !rawUser) {
      router.push("/frontend/portal/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      setUser(parsedUser);
      setToken(rawToken);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/frontend/portal/login");
      return;
    }

    const idFromQuery = searchParams.get("formulaId");
    if (idFromQuery) {
      setFormulaId(idFromQuery);
    }

    setLoadingUser(false);
  }, [router, searchParams]);

  useEffect(() => {
    if (!token || !formulaId) return;
    void loadFormula(formulaId, token);
  }, [formulaId, token]);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!dragState || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const nextX = clamp(e.clientX - rect.left - dragState.offsetX, 0, rect.width - 150);
      const nextY = clamp(e.clientY - rect.top - dragState.offsetY, 0, rect.height - 84);

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, x: nextX, y: nextY }
            : node
        )
      );
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  async function loadFormula(id: string, bearerToken: string) {
    setLoadingFormula(true);
    setError("");
    setSaveSuccess("");
    setSaveError("");

    try {
      const res = await fetch(`/backend/api/formulas/getFormula/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const text = await res.text();
      let data: GetFormulaResponse | null = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { error: text || "Invalid server response" };
      }

      if (!res.ok || !data?.formula) {
        setError(data?.error || data?.message || "Failed to load formula");
        setFormula(null);
        setNodes([]);
        setEdges([]);
        return;
      }

      const loadedFormula = data.formula;
      const loadedVariables = data.variables || [];

      setFormula(loadedFormula);
      setName(loadedFormula.name || "");
      setDescription(loadedFormula.description || "");

      let loadedNodes: BuilderNode[] = [];
      let loadedEdges: BuilderEdge[] = [];

      if (Array.isArray(loadedFormula.data?.nodes) && loadedFormula.data.nodes.length) {
        loadedNodes = loadedFormula.data.nodes.map((node, index) => ({
          id: node.id || makeNodeId(),
          label: node.label,
          quantity: node.quantity ?? 1,
          x: node.x ?? 80 + index * 40,
          y: node.y ?? 80 + index * 40,
        }));

        loadedEdges = Array.isArray(loadedFormula.data?.edges)
          ? loadedFormula.data.edges.map((edge) => ({
              id: edge.id || makeEdgeId(),
              from: edge.from,
              to: edge.to,
            }))
          : [];
      } else {
        loadedNodes = loadedVariables.map((v, index) => ({
          id: makeNodeId(),
          label: v.name,
          quantity: v.base_value ?? 1,
          x: 100 + (index % 3) * 180,
          y: 80 + Math.floor(index / 3) * 120,
        }));
      }

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setSelectedNodeId(loadedNodes[0]?.id ?? null);
      setSelectedEdgeId(null);
      setPendingConnectionFrom(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load formula");
      setFormula(null);
      setNodes([]);
      setEdges([]);
    } finally {
      setLoadingFormula(false);
    }
  }

  function addNode() {
    const newNode: BuilderNode = {
      id: makeNodeId(),
      label: `Node ${nodes.length + 1}`,
      quantity: 1,
      x: 120 + (nodes.length % 3) * 160,
      y: 100 + Math.floor(nodes.length / 3) * 100,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    const nextNodes = nodes.filter((node) => node.id !== selectedNodeId);
    const nextEdges = edges.filter(
      (edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId
    );

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(nextNodes[0]?.id ?? null);
    setSelectedEdgeId(null);
    if (pendingConnectionFrom === selectedNodeId) {
      setPendingConnectionFrom(null);
    }
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  function updateSelectedNode(patch: Partial<BuilderNode>) {
    if (!selectedNodeId) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId ? { ...node, ...patch } : node
      )
    );
  }

  function beginDrag(
    e: React.PointerEvent<HTMLDivElement>,
    node: BuilderNode
  ) {
    if (connectMode) return;
    if (!canvasRef.current) return;

    const nodeRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - nodeRect.left;
    const offsetY = e.clientY - nodeRect.top;

    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setDragState({
      nodeId: node.id,
      offsetX,
      offsetY,
    });
  }

  function handleNodeClick(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);

    if (!connectMode) return;

    if (!pendingConnectionFrom) {
      setPendingConnectionFrom(nodeId);
      return;
    }

    if (pendingConnectionFrom === nodeId) {
      setPendingConnectionFrom(null);
      return;
    }

    const alreadyExists = edges.some(
      (edge) => edge.from === pendingConnectionFrom && edge.to === nodeId
    );

    if (!alreadyExists) {
      const newEdge: BuilderEdge = {
        id: makeEdgeId(),
        from: pendingConnectionFrom,
        to: nodeId,
      };
      setEdges((prev) => [...prev, newEdge]);
    }

    setPendingConnectionFrom(null);
  }

  function getNodeCenter(nodeId: string) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    return {
      x: node.x + 75,
      y: node.y + 42,
    };
  }

  function deriveGraphGroups() {
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();

    for (const node of nodes) {
      incomingCount.set(node.id, 0);
      outgoingCount.set(node.id, 0);
    }

    for (const edge of edges) {
      outgoingCount.set(edge.from, (outgoingCount.get(edge.from) || 0) + 1);
      incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
    }

    const inputs = nodes.filter(
      (node) => (incomingCount.get(node.id) || 0) === 0 && (outgoingCount.get(node.id) || 0) > 0
    );

    const outputs = nodes.filter(
      (node) => (incomingCount.get(node.id) || 0) > 0 && (outgoingCount.get(node.id) || 0) === 0
    );

    return { inputs, outputs };
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      setSaveError("Missing token");
      return;
    }

    if (!name.trim()) {
      setSaveError("Formula name is required");
      return;
    }

    if (nodes.length < 2) {
      setSaveError("Add at least two nodes");
      return;
    }

    if (edges.length < 1) {
      setSaveError("Create at least one connection");
      return;
    }

    const { inputs, outputs } = deriveGraphGroups();

    if (inputs.length === 0 || outputs.length === 0) {
      setSaveError(
        "Formula must have at least one start node and one end node connected"
      );
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const data = {
        ...(formula?.data || {}),
        inputs: inputs.map((node) => ({
          item: node.label.trim(),
          quantity: Number(node.quantity) || 1,
        })),
        outputs: outputs.map((node) => ({
          item: node.label.trim(),
          quantity: Number(node.quantity) || 1,
        })),
        nodes,
        edges,
      };

      if (formulaId) {
        const payload = {
          name: name.trim(),
          description: description.trim() || null,
          folder_id: formula?.folder_id ?? null,
          data,
          variables: [
            ...inputs.map((node) => ({
              name: node.label.trim(),
              type: "input",
              base_value: Number(node.quantity) || 1,
            })),
            ...outputs.map((node) => ({
              name: node.label.trim(),
              type: "output",
              base_value: Number(node.quantity) || 1,
            })),
          ],
        };

        const res = await fetch(`/backend/api/formulas/updateFormula/${formulaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let result: any = null;

        try {
          result = text ? JSON.parse(text) : null;
        } catch {
          result = { error: text || "Invalid server response" };
        }

        if (!res.ok) {
          setSaveError(result?.error || result?.message || "Failed to save formula");
          return;
        }
      } else {
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          folderId: null,
          data,
        };

        const res = await fetch("/backend/api/formulas/createFormula", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let result: any = null;

        try {
          result = text ? JSON.parse(text) : null;
        } catch {
          result = { error: text || "Invalid server response" };
        }

        if (!res.ok || !result?.success) {
          setSaveError(result?.error || result?.message || "Failed to create formula");
          return;
        }
      }

      setSaveSuccess("Formula saved successfully");
      router.push("/frontend/portal/formulas");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save formula");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/frontend/portal/login");
  }

  if (loadingUser) {
    return <main className={styles.page}>Loading user...</main>;
  }

  if (loadingFormula) {
    return <main className={styles.page}>Loading formula...</main>;
  }

  const { inputs, outputs } = deriveGraphGroups();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Formula Builder</h1>
          <p className={styles.subtitle}>
            {formulaId ? "Editing existing formula" : "Creating new formula"}
          </p>
        </div>

        <div className={styles.headerLinks}>
          <Link href="/frontend">Home</Link>
          <Link href="/frontend/portal/formulas">Back to Formulas</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.layout}>
        <form className={styles.sidebar} onSubmit={handleSave}>
          <h2>Formula Details</h2>

          <label className={styles.field}>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className={styles.buttonRow}>
            <button type="button" onClick={addNode}>
              Add Node
            </button>
            <button
              type="button"
              onClick={() => {
                setConnectMode((prev) => !prev);
                setPendingConnectionFrom(null);
                setSelectedEdgeId(null);
              }}
            >
              {connectMode ? "Exit Connect Mode" : "Connect Nodes"}
            </button>
          </div>

          <div className={styles.selectedPanel}>
            <h3>Selected Node</h3>

            {selectedNode ? (
              <>
                <label className={styles.field}>
                  <span>Label</span>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) =>
                      updateSelectedNode({ label: e.target.value })
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedNode.quantity}
                    onChange={(e) =>
                      updateSelectedNode({
                        quantity: Number(e.target.value) || 1,
                      })
                    }
                  />
                </label>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={deleteSelectedNode}
                >
                  Delete Selected Node
                </button>
              </>
            ) : (
              <p>No node selected.</p>
            )}
          </div>

          <div className={styles.selectedPanel}>
            <h3>Selected Connection</h3>
            {selectedEdgeId ? (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={deleteSelectedEdge}
              >
                Delete Selected Connection
              </button>
            ) : (
              <p>No connection selected.</p>
            )}
          </div>

          <div className={styles.metaPanel}>
            <h3>Derived Graph Roles</h3>
            <p>Start nodes (inputs): {inputs.length}</p>
            <p>End nodes (outputs): {outputs.length}</p>
            <p>Total nodes: {nodes.length}</p>
            <p>Total connections: {edges.length}</p>
            {connectMode ? (
              <p>
                Connect mode active
                {pendingConnectionFrom ? " — choose destination node" : " — choose source node"}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : formulaId ? "Save Formula" : "Create Formula"}
          </button>

          {saveError ? <p className={styles.error}>{saveError}</p> : null}
          {saveSuccess ? <p className={styles.success}>{saveSuccess}</p> : null}
        </form>

        <section className={styles.canvasPanel}>
          <div className={styles.canvasHeader}>
            <h2>Canvas</h2>
            <p>
              Drag nodes to arrange them. Use connect mode to create directed links.
            </p>
          </div>

          <div ref={canvasRef} className={styles.canvas}>
            <svg className={styles.edgeLayer}>
              {edges.map((edge) => {
                const from = getNodeCenter(edge.from);
                const to = getNodeCenter(edge.to);
                if (!from || !to) return null;

                return (
                  <line
                    key={edge.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={`${styles.edge} ${
                      selectedEdgeId === edge.id ? styles.edgeSelected : ""
                    }`}
                    onClick={() => {
                      setSelectedEdgeId(edge.id);
                      setSelectedNodeId(null);
                    }}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.node} ${
                  selectedNodeId === node.id ? styles.selected : ""
                } ${
                  pendingConnectionFrom === node.id ? styles.pendingConnection : ""
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
                onPointerDown={(e) => beginDrag(e, node)}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={styles.nodeLabel}>{node.label}</div>
                <div className={styles.nodeQty}>x{node.quantity}</div>
              </div>
            ))}

            {nodes.length === 0 ? (
              <div className={styles.emptyCanvas}>
                Add nodes, move them around, and connect them to build a formula.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading builder...</main>}>
      <BuilderInner />
    </Suspense>
  );
}