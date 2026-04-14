import Link from "next/link";
import TopNav from "./ui/TopNav";
import styles from "./frontend.module.css";

export default function FrontendHome() {
  return (
    <main className={styles.page}>
      <TopNav />

      <section className={styles.heroWrap}>
        <div className={styles.heroCard}>
          <h1 className={styles.title}>Sign in to get started</h1>
          <p className={styles.subtitle}>
            Create an account to start building your formula collection
          </p>

          <Link href="/frontend/portal/login" className={styles.cta}>
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}