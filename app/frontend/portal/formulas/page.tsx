import Link from "next/link";

export default function FormulasPage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Formulas</h1>
      <p>This page will show formula folders and saved formulas later.</p>

      <ul>
        <li>Placeholder formula 1</li>
        <li>Placeholder formula 2</li>
        <li>Placeholder formula 3</li>
      </ul>

      <p>
        <Link href="/frontend/portal/builder">Go to Builder</Link>
      </p>

      <p>
        <Link href="/frontend">Back Home</Link>
      </p>
    </main>
  );
}