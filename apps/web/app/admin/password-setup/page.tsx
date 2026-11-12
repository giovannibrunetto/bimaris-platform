import PasswordSetup from "./PasswordSetup";
import "../login/admin-login.css";
export const dynamic = "force-dynamic";
export default function Page() {
  return <section className="admin-login"><div className="admin-login__card">
    <div className="admin-login__eyebrow">Sicurezza · BIMARIS Staging</div>
    <h1>Imposta la password personale</h1>
    <p className="admin-login__description">Richiedi un collegamento alla tua email, quindi imposta una password. Non condividere il collegamento.</p>
    <PasswordSetup />
  </div></section>;
}
