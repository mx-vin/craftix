import Link from "next/link";

export default function FrontendHome() {
  return (
    <main>
      <h1>Craftix</h1>
      <p>Create an account to start building your formula collection.</p>
      <Link href="/frontend/portal/login">Sign In</Link>
    </main>
  );
}