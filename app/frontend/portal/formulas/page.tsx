"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../ui/TopNav";
import styles from "./formulas.module.css";

type Folder = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

type StoredUser = {
  id: string;
  username: string;
  email: string;
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
    nodes?: FormulaNode[];
    edges?: FormulaEdge[];
  };
};

export default function FormulasPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState("");

  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");

    if (!rawToken || !rawUser) {
      router.push("/frontend/portal/login");
      return;
    }

    setToken(rawToken);
    setUser(JSON.parse(rawUser));
  }, [router]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (!user || !token) return;

    loadFormulas(user.id);
    loadFolders(user.id);
  }, [user, token]);

  async function loadFormulas(userId: string) {
    setLoading(true);

    try {
      const res = await fetch(`/backend/api/formulas/getAllFormulas/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load formulas");
        return;
      }

      setFormulas(data.formulas || []);

      if (data.formulas?.length) {
        setSelectedFormulaId(data.formulas[0].id);
      }
    } catch {
      setError("Failed to load formulas");
    } finally {
      setLoading(false);
    }
  }

  async function loadFolders(userId: string) {
    try {
      const res = await fetch(`/backend/api/folders/getAllFolders/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setFolders(data.folders || []);
    } catch {}
  }

  // =========================
  // MOVE FORMULA
  // =========================
  async function moveFormulaToFolder(formulaId: string, folderId: string | null) {
    await fetch(`/backend/api/formulas/moveFormulaToFolder/${formulaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folderId }),
    });

    if (user) loadFormulas(user.id);
  }

  // =========================
  // FILTER
  // =========================
  const filteredFormulas = useMemo(() => {
    if (selectedFolder === "all") return formulas;

    return formulas.filter(
      (f) => (f.folderId || f.folder_id || "ungrouped") === selectedFolder
    );
  }, [formulas, selectedFolder]);

  const selectedFormula =
    filteredFormulas.find((f) => f.id === selectedFormulaId) || null;

  // =========================
  // UI
  // =========================
  if (!user) return <main className={styles.page}>Loading...</main>;

  return (
    <main className={styles.page}>
      <TopNav />

      <div className={styles.shell}>
        {/* ================= SIDEBAR ================= */}
        <aside className={styles.sidebar}>
          <h2>Folders</h2>

          <button onClick={() => setSelectedFolder("all")}>
            All Formulas
          </button>

          <button onClick={() => setSelectedFolder("ungrouped")}>
            Ungrouped
          </button>

          {folders.map((f) => (
            <button key={f.id} onClick={() => setSelectedFolder(f.id)}>
              {f.name}
            </button>
          ))}

          <h3>Formulas</h3>

          {loading ? (
            <p>Loading...</p>
          ) : (
            filteredFormulas.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFormulaId(f.id)}
              >
                {f.name}
              </button>
            ))
          )}
        </aside>

        {/* ================= MAIN ================= */}
        <section className={styles.mainPanel}>
          {!selectedFormula ? (
            <p>No formula selected</p>
          ) : (
            <>
              {/* HEADER */}
              <div className={styles.panelHeader}>
                <div>
                  <h1>{selectedFormula.name}</h1>
                  <p>{selectedFormula.description}</p>
                </div>

                {/* ACTION ROW (FIXED LOCATION) */}
                <div className={styles.actionRow}>
                  <select
                    value={
                      selectedFormula.folderId ||
                      selectedFormula.folder_id ||
                      ""
                    }
                    onChange={(e) =>
                      moveFormulaToFolder(
                        selectedFormula.id,
                        e.target.value || null
                      )
                    }
                  >
                    <option value="">Ungrouped</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/frontend/portal/builder?formulaId=${selectedFormula.id}`}
                  >
                    Edit
                  </Link>
                </div>
              </div>

              {/* GRAPH PLACEHOLDER */}
              <div className={styles.graph}>
                <p>Graph here</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}