"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../ui/TopNav";
import styles from "./formulas.module.css";

type StoredUser = {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean;
};

type FormulaNode = {
  id: string;
  label: string;
  quantity?: string | number;
  x: number;
  y: number;
};

type FormulaEdge = {
  id: string;
  from: string;
  to: string;
};

type Formula = {
  id: string;
  folder_id?: string | null;
  folderId?: string | null;
  name: string;
  description: string | null;
  data: {
    inputs?: { item: string; quantity?: number }[];
    outputs?: { item: string; quantity?: number }[];
    nodes?: FormulaNode[];
    edges?: FormulaEdge[];
    [key: string]: any;
  };
};

type GetAllFormulasResponse = {
  success: boolean;
  formulas?: Formula[];
  error?: string;
  detail?: string;
};

type CalculationResult = {
  success?: boolean;
  used?: Record<string, number>;
  results?: Record<string, number>;
  nodeValues?: Record<string, number>;
  scale?: number;
  error?: string;
  message?: string;
};

type FolderGroup = {
  key: string;
  label: string;
  count: number;
};

type CanvasOffset = {
  x: number;
  y: number;
};

type PanState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.4;
const ZOOM_STEP = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function FormulasPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");

  const [calculating, setCalculating] = useState<Record<string, boolean>>({});
  const [calculationErrors, setCalculationErrors] = useState<Record<string, string>>({});
  const [calculationResults, setCalculationResults] = useState<Record<string, CalculationResult>>({});

  const [overrideValues, setOverrideValues] = useState<Record<string, Record<string, string>>>({});

  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>({ x: 0, y: 0 });
  const [panState, setPanState] = useState<PanState>(null);
  const [zoom, setZoom] = useState(0.6);

  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (!rawToken || !rawUser) {
      router.push("/frontend/portal/login");
      return;
    }

    try {
      setUser(JSON.parse(rawUser));
      setToken(rawToken);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/frontend/portal/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user || !token) return;
    void loadFormulas(user.id, token);
  }, [user, token]);

  useEffect(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setZoom(0.6);
  }, [selectedFormulaId]);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!panState) return;

      setCanvasOffset({
        x: panState.originX + (e.clientX - panState.startX),
        y: panState.originY + (e.clientY - panState.startY),
      });
    }

    function handlePointerUp() {
      setPanState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [panState]);

  async function loadFormulas(userId: string, bearerToken: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/backend/api/formulas/getAllFormulas/${userId}`, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      const data: GetAllFormulasResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.detail || "Failed to load formulas");
        setFormulas([]);
        return;
      }

      const loaded = data.formulas || [];
      setFormulas(loaded);

      if (loaded.length > 0 && !selectedFormulaId) {
        setSelectedFormulaId(loaded[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load formulas");
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFormula(formulaId: string) {
    if (!user || !token) return;

    setDeleteError("");

    try {
      const res = await fetch(`/backend/api/formulas/deleteFormula/${formulaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data?.error || data?.message || "Failed to delete formula");
        return;
      }

      await loadFormulas(user.id, token);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete formula");
    }
  }

  async function handleCalculate(formula: Formula) {
    setCalculationErrors((prev) => ({ ...prev, [formula.id]: "" }));
    setCalculating((prev) => ({ ...prev, [formula.id]: true }));

    try {
      const formulaOverrides = overrideValues[formula.id] || {};
      const inputs: Record<string, number> = {};

      for (const node of formula.data?.nodes || []) {
        const rawValue = formulaOverrides[node.id];

        if (rawValue === undefined || rawValue === "") continue;

        const parsedValue = Number(rawValue);

        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
          setCalculationErrors((prev) => ({
            ...prev,
            [formula.id]: "All edited values must be valid non-negative numbers",
          }));
          setCalculating((prev) => ({ ...prev, [formula.id]: false }));
          return;
        }

        inputs[node.label] = parsedValue;
      }

      const res = await fetch(`/backend/api/formulas/calculateFormula/${formula.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      });

      const data: CalculationResult = await res.json();

      if (!res.ok) {
        setCalculationErrors((prev) => ({
          ...prev,
          [formula.id]: data?.error || data?.message || "Failed to calculate formula",
        }));
        return;
      }

      setCalculationResults((prev) => ({
        ...prev,
        [formula.id]: data,
      }));
    } catch (err: any) {
      setCalculationErrors((prev) => ({
        ...prev,
        [formula.id]: err?.message || "Failed to calculate formula",
      }));
    } finally {
      setCalculating((prev) => ({ ...prev, [formula.id]: false }));
    }
  }

  function updateOverride(formulaId: string, nodeId: string, value: string) {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setOverrideValues((prev) => ({
      ...prev,
      [formulaId]: {
        ...(prev[formulaId] || {}),
        [nodeId]: value,
      },
    }));
  }

  const folderGroups = useMemo<FolderGroup[]>(() => {
    const map = new Map<string, FolderGroup>();

    for (const formula of formulas) {
      const folderKey = formula.folderId || formula.folder_id || "ungrouped";

      if (!map.has(folderKey)) {
        map.set(folderKey, {
          key: folderKey,
          label: folderKey === "ungrouped" ? "Ungrouped" : `Folder ${folderKey.slice(0, 6)}`,
          count: 0,
        });
      }

      map.get(folderKey)!.count += 1;
    }

    return [
      { key: "all", label: "All Formulas", count: formulas.length },
      ...Array.from(map.values()),
    ];
  }, [formulas]);

  const filteredFormulas = useMemo(() => {
    if (selectedFolder === "all") return formulas;
    return formulas.filter(
      (formula) => (formula.folderId || formula.folder_id || "ungrouped") === selectedFolder
    );
  }, [formulas, selectedFolder]);

  useEffect(() => {
    if (filteredFormulas.length > 0) {
      const exists = filteredFormulas.some((formula) => formula.id === selectedFormulaId);
      if (!exists) setSelectedFormulaId(filteredFormulas[0].id);
    }
  }, [filteredFormulas, selectedFormulaId]);

  const selectedFormula =
    filteredFormulas.find((formula) => formula.id === selectedFormulaId) || null;

  function getNodeCenter(nodeId: string) {
    const node = selectedFormula?.data?.nodes?.find((n) => n.id === nodeId);
    if (!node) return null;

    return {
      x: node.x + 88,
      y: node.y + 48,
    };
  }

  function beginPan(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).dataset.role === "graph-node") return;
    if ((e.target as HTMLElement).dataset.role === "node-input") return;

    setPanState({
      startX: e.clientX,
      startY: e.clientY,
      originX: canvasOffset.x,
      originY: canvasOffset.y,
    });
  }

  function zoomIn() {
    setZoom((prev) => clamp(Number((prev + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  }

  function zoomOut() {
    setZoom((prev) => clamp(Number((prev - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  }

  function resetView() {
    setCanvasOffset({ x: 0, y: 0 });
    setZoom(0.6);
  }

  function getNodeCalculatedValue(formulaId: string, nodeId: string) {
    return calculationResults[formulaId]?.nodeValues?.[nodeId];
  }

  if (!user) {
    return <main className={styles.page}>Loading user...</main>;
  }

  return (
    <main className={styles.page}>
      <TopNav />

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Formulas</h2>
            <Link href="/frontend/portal/builder" className={styles.createButton}>
              + New Formula
            </Link>
          </div>

          <div className={styles.folderSection}>
            <p className={styles.sectionLabel}>Folders</p>

            <div className={styles.folderList}>
              {folderGroups.map((folder) => (
                <button
                  key={folder.key}
                  type="button"
                  className={
                    selectedFolder === folder.key
                      ? `${styles.folderButton} ${styles.folderButtonActive}`
                      : styles.folderButton
                  }
                  onClick={() => setSelectedFolder(folder.key)}
                >
                  <span>{folder.label}</span>
                  <span className={styles.folderCount}>{folder.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formulaSection}>
            <p className={styles.sectionLabel}>Saved Formulas</p>

            {loading ? (
              <p>Loading formulas...</p>
            ) : filteredFormulas.length === 0 ? (
              <p>No formulas found.</p>
            ) : (
              <div className={styles.formulaList}>
                {filteredFormulas.map((formula) => (
                  <button
                    key={formula.id}
                    type="button"
                    className={
                      selectedFormulaId === formula.id
                        ? `${styles.formulaCard} ${styles.formulaCardActive}`
                        : styles.formulaCard
                    }
                    onClick={() => setSelectedFormulaId(formula.id)}
                  >
                    <strong>{formula.name}</strong>
                    <span>{formula.description || "No description"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className={styles.mainPanel}>
          {error ? <p className={styles.error}>{error}</p> : null}
          {deleteError ? <p className={styles.error}>{deleteError}</p> : null}

          {!selectedFormula ? (
            <div className={styles.emptyState}>
              <h2>No formula selected</h2>
              <p>Create one to get started.</p>
              <Link href="/frontend/portal/builder" className={styles.createButton}>
                Create Formula
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h1 className={styles.mainTitle}>{selectedFormula.name}</h1>
                  <p className={styles.mainSubtitle}>
                    {selectedFormula.description || "No description"}
                  </p>
                </div>

                <div className={styles.actionRow}>
                  <Link
                    href={`/frontend/portal/builder?formulaId=${selectedFormula.id}`}
                    className={styles.editButton}
                  >
                    Edit Formula
                  </Link>

                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteFormula(selectedFormula.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className={styles.workspace}>
                <div className={styles.graphPanel}>
                  <div className={styles.graphHeader}>
                    <div>
                      <h3>Formula Graph</h3>
                      <p>Edit values directly in nodes, then calculate.</p>
                    </div>

                    <div className={styles.zoomControls}>
                      <button type="button" onClick={zoomOut}>-</button>
                      <span>{Math.round(zoom * 100)}%</span>
                      <button type="button" onClick={zoomIn}>+</button>
                      <button type="button" onClick={resetView}>Reset</button>
                    </div>
                  </div>

                  <div className={styles.graphViewport} onPointerDown={beginPan}>
                    <div
                      className={styles.graphWorld}
                      style={{
                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                      }}
                    >
                      <svg className={styles.edgeLayer}>
                        {(selectedFormula.data?.edges || []).map((edge) => {
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
                              className={styles.edge}
                            />
                          );
                        })}
                      </svg>

                      {(selectedFormula.data?.nodes || []).map((node) => {
                        const calculatedValue = getNodeCalculatedValue(selectedFormula.id, node.id);
                        const editedValue = overrideValues[selectedFormula.id]?.[node.id] ?? "";

                        return (
                          <div
                            key={node.id}
                            data-role="graph-node"
                            className={styles.graphNode}
                            style={{
                              left: `${node.x}px`,
                              top: `${node.y}px`,
                            }}
                          >
                            <div className={styles.graphNodeLabel}>{node.label}</div>

                            <div className={styles.graphNodeBase}>
                              Base: x{node.quantity ?? 1}
                            </div>

                            <input
                              data-role="node-input"
                              className={styles.nodeValueInput}
                              type="number"
                              min="0"
                              placeholder="Have..."
                              value={editedValue}
                              onChange={(e) =>
                                updateOverride(selectedFormula.id, node.id, e.target.value)
                              }
                            />

                            {calculatedValue !== undefined ? (
                              <div className={styles.graphNodeComputed}>
                                Calc: {calculatedValue}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.sideCards}>
                  <div className={styles.infoCard}>
                    <h3>Calculate Formula</h3>

                    <p>
                      Enter any values you have directly inside the nodes. The smallest usable
                      amount controls the final calculation.
                    </p>

                    <button
                      type="button"
                      className={styles.calcButton}
                      onClick={() => handleCalculate(selectedFormula)}
                      disabled={!!calculating[selectedFormula.id]}
                    >
                      {calculating[selectedFormula.id] ? "Calculating..." : "Calculate"}
                    </button>

                    {calculationErrors[selectedFormula.id] ? (
                      <p className={styles.error}>
                        {calculationErrors[selectedFormula.id]}
                      </p>
                    ) : null}

                    {calculationResults[selectedFormula.id]?.scale !== undefined ? (
                      <p className={styles.scaleText}>
                        Scale: {calculationResults[selectedFormula.id]?.scale}
                      </p>
                    ) : null}

                    {calculationResults[selectedFormula.id]?.used ? (
                      <div className={styles.calcResults}>
                        <strong>Used</strong>
                        <ul>
                          {Object.entries(calculationResults[selectedFormula.id]?.used || {}).map(
                            ([key, value]) => (
                              <li key={`used-${key}`}>
                                {key}: {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : null}

                    {calculationResults[selectedFormula.id]?.results ? (
                      <div className={styles.calcResults}>
                        <strong>Results</strong>
                        <ul>
                          {Object.entries(calculationResults[selectedFormula.id]?.results || {}).map(
                            ([key, value]) => (
                              <li key={`result-${key}`}>
                                {key}: {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}