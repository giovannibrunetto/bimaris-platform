import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.brand} href="/" aria-label="BIMARIS — Messina da Vivere">
        <span className={styles.brandImage} />
      </Link>
      <div className={styles.links}>
        <Link href="/cultura">Cultura</Link>
        <Link href="/storie-miti-leggende">Miti e leggende</Link>
        <Link href="/itinerari">Percorsi</Link>
        <Link href="/mappa">Mappa</Link>
        <Link href="/operatori/candidatura">Operatori</Link>
        <Link href="/contatti">Contatti</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookie">Cookie</Link>
        <Link href="/note-legali">Note legali</Link>
      </div>
      <p className={styles.copyright}>© 2026 BIMARIS — Messina da Vivere.</p>
    </footer>
  );
}
