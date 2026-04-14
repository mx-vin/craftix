import Link from "next/link";

export default function BuilderPage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Builder</h1>
      <p>This page will become the formula builder.</p>

      <div
        style={{
          marginTop: "16px",
          padding: "24px",
          border: "1px solid #ccc",
        }}
      >
        Builder canvas placeholder
      </div>

      <p style={{ marginTop: "16px" }}>
        <Link href="/frontend/portal/formulas">Back to Formulas</Link>
      </p>
    </main>
  );
}