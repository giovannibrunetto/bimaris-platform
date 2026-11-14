import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const messages: Record<string,string> = {
  "membership-linked":"Account collegato.",
  "membership-role-updated":"Ruolo aggiornato.",
  "membership-revoked":"Accesso revocato per questa attività; l'account personale rimane attivo.",
  "membership-already-linked":"Account già collegato. Modifica il ruolo nell'elenco degli accessi.",
  "membership-user-not-found":"Account non trovato: deve essere già registrato.",
  "membership-not-found":"Collegamento non trovato.",
  "last-owner-protected":"Operazione bloccata: ogni attività deve conservare almeno un titolare.",
  "membership-invalid":"Dati di accesso non validi.",
  "membership-error":"Operazione non riuscita.",
  "operator-not-found":"Attività non trovata.",
  "service-error":"Servizio non disponibile.",
  "invalid-origin":"Richiesta non valida.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  if (!db) throw new Error("Supabase non configurato");
  const [{ data: operators, error: operatorsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    db.from("operators").select("id,slug,name,category,published").order("name"),
    db.from("operator_memberships").select("operator_id,user_id,role,created_at"),
  ]);
  if (operatorsError || membershipsError) throw new Error("Impossibile caricare gli accessi operatori");
  const uniqueUserIds = [...new Set((memberships ?? []).map(m => m.user_id))];
  const identityPairs = await Promise.all(uniqueUserIds.map(async id => {
    const { data, error } = await db.auth.admin.getUserById(id);
    return [id, error ? null : data.user?.email ?? null] as const;
  }));
  const accountEmails = new Map(identityPairs);
  const state = (await searchParams).state;
  const message = state ? messages[state] : undefined;

  return <section className="section">
    <div className="section-head"><div><div className="kicker">Area privata</div><h1>Accessi operatori</h1></div><Link className="button ghost" href="/admin/operatori">Torna agli operatori</Link></div>
    <p>Gli account di accesso sono distinti dalle email pubbliche delle attività. Il collegamento a un'attività può essere aggiornato o revocato senza cancellare l'utente Supabase.</p>
    {message && <p role="status" className="detail-panel">{message}</p>}
    <div style={{display:"grid",gap:18,marginTop:24}}>
      {(operators ?? []).map(o => {
        const linked = (memberships ?? []).filter(m => m.operator_id === o.id);
        const owners = linked.filter(m => m.role === "owner").length;
        return <article className="detail-panel" key={o.id}>
          <div className="eyebrow">{o.category ?? "Operatore"} · {o.published ? "Online" : "Non pubblicato"}</div>
          <h3>{o.name}</h3>
          <p style={{fontSize:13}}>Account collegati: {linked.length} · Titolari: {owners}</p>
          {linked.length > 0 ? <div style={{display:"grid",gap:12,margin:"16px 0 22px"}}>
            {linked.map(member => <div key={member.user_id} style={{padding:"14px 16px",border:"1px solid #ded5c8",borderRadius:12,background:"#fff"}}>
              <div style={{fontWeight:700,overflowWrap:"anywhere"}}>{accountEmails.get(member.user_id) ?? "Account senza email disponibile"}</div>
              <div style={{fontSize:12,color:"#59666b",margin:"4px 0 12px"}}>{member.role === "owner" ? "Titolare" : member.role === "manager" ? "Manager" : "Solo lettura"}</div>
              <form method="post" action="/api/admin/operator-memberships" style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}>
                <input type="hidden" name="operator_id" value={o.id}/>
                <input type="hidden" name="user_id" value={member.user_id}/>
                <label>Ruolo<select name="role" defaultValue={member.role}><option value="owner">Titolare</option><option value="manager">Manager</option><option value="viewer">Solo lettura</option></select></label>
                <button className="button ghost" type="submit" name="action" value="update_role">Aggiorna ruolo</button>
                <button className="button ghost" type="submit" name="action" value="revoke" disabled={member.role === "owner" && owners <= 1}>Revoca accesso</button>
              </form>
              {member.role === "owner" && owners <= 1 && <small>L'ultimo titolare non può essere rimosso o declassato.</small>}
            </div>)}
          </div> : <p>Nessun account collegato.</p>}
          <form method="post" action="/api/admin/operator-memberships" style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end"}}>
            <input type="hidden" name="operator_id" value={o.id}/>
            <label>Email dell'account di accesso<input name="email" type="email" autoComplete="off" required/></label>
            <label>Ruolo<select name="role" defaultValue="manager"><option value="owner">Titolare</option><option value="manager">Manager</option><option value="viewer">Solo lettura</option></select></label>
            <button className="button" type="submit" name="action" value="link">Collega account esistente</button>
          </form>
        </article>;
      })}
    </div>
  </section>;
}
