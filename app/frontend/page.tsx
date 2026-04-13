import Link from 'next/link';

export default function FrontendHome() {
  return (
    <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Craftix</h1>
      <p>This frontend is connected to the current auth backend.</p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Link href="/frontend/portal/login">Login</Link>
        <Link href="/frontend/portal/register">Register</Link>
      </div>
    </main>
  );
}