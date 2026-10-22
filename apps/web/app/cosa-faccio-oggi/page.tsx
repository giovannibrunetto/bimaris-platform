import Link from "next/link";
import { discoverExperiences, DISCOVERY_AUDIENCES, DISCOVERY_INTENTS, type DiscoveryAudience, type DiscoveryIntent } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const intentLabels: Record<DiscoveryIntent, string> = {
  culture: "Cultura",
  "food-wine": "Sapori",
  nature: "Natura",
  sea: "Mare",
  adventure: "Avventura",
  relax: "Relax",
  "stories-places": "Storie e luoghi",
};
const audienceLabels: Record<DiscoveryAudience, string> = {
  solo: "Da solo",
  couple: "In coppia",
  friends: "Con amici",
  family: "In famiglia",
};
const durationOptions = [
  [60, "1 ora"],
  [120, "2 ore"],
  [180, "3 ore"],
  [360, "Mezza giornata"],
] as const;

function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function validIntent(value?: string): value is DiscoveryIntent { return !!value && (DISCOVERY_INTENTS as readonly string[]).includes(value); }
function validAudience(value?: string): value is DiscoveryAudience { return !!value && (DISCOVERY_AUDIENCES as readonly string[]).includes(value); }

export default async function DiscoveryTodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const intentRaw = one(params.intent);
  const audienceRaw = one(params.audience);
  const minutesRaw = Number(one(params.minutes));
  const intent = validIntent(intentRaw) ? intentRaw : undefined;
  const audience = validAudience(audienceRaw) ? audienceRaw : undefined;
  const minutes = durationOptions.some(([v]) => v === minutesRaw) ? minutesRaw : undefined;
  const complete = !!intent && !!audience && !!minutes;
  const results = complete ? await discoverExperiences({ intent, audience, availableMinutes: minutes, limit: 3 }) : [];

  return <>
    <section className="page-hero" style={{maxWidth:920,margin:"0 auto",textAlign:"center"}}>
      <div className="kicker">DISCOVERY · PROTOTIPO STAGING</div>
      <h1>Cosa faccio oggi?</h1>
      <p>Tre scelte rapide. BIMARIS seleziona solo proposte compatibili con quello che vuoi fare adesso.</p>
    </section>

    <section className="section" style={{maxWidth:980,margin:"0 auto",paddingTop:24}}>
      <form method="get" style={{display:"grid",gap:28}}>
        <fieldset style={{border:0,padding:0,margin:0}}>
          <legend className="kicker" style={{marginBottom:12}}>1 · Cosa ti va?</legend>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{DISCOVERY_INTENTS.map(key => <label key={key} className="detail-panel" style={{padding:"12px 16px",cursor:"pointer",border:intent===key?"2px solid #8a5b3d":"1px solid #ddd"}}><input type="radio" name="intent" value={key} defaultChecked={intent===key} style={{marginRight:8}}/>{intentLabels[key]}</label>)}</div>
        </fieldset>

        <fieldset style={{border:0,padding:0,margin:0}}>
          <legend className="kicker" style={{marginBottom:12}}>2 · Con chi sei?</legend>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{DISCOVERY_AUDIENCES.map(key => <label key={key} className="detail-panel" style={{padding:"12px 16px",cursor:"pointer",border:audience===key?"2px solid #8a5b3d":"1px solid #ddd"}}><input type="radio" name="audience" value={key} defaultChecked={audience===key} style={{marginRight:8}}/>{audienceLabels[key]}</label>)}</div>
        </fieldset>

        <fieldset style={{border:0,padding:0,margin:0}}>
          <legend className="kicker" style={{marginBottom:12}}>3 · Quanto tempo hai?</legend>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{durationOptions.map(([value,label]) => <label key={value} className="detail-panel" style={{padding:"12px 16px",cursor:"pointer",border:minutes===value?"2px solid #8a5b3d":"1px solid #ddd"}}><input type="radio" name="minutes" value={value} defaultChecked={minutes===value} style={{marginRight:8}}/>{label}</label>)}</div>
        </fieldset>

        <button className="button" type="submit" style={{justifySelf:"start"}}>Trova cosa fare →</button>
      </form>
    </section>

    {complete && <section className="section sand" style={{marginTop:24}}>
      <div className="section-head"><div><div className="kicker">SCELTE BIMARIS</div><h2>{results.length ? "Le proposte per te" : "Nessuna proposta compatibile"}</h2></div><p>{results.length ? "Non un elenco infinito: fino a tre possibilità coerenti con le tue scelte e con la disponibilità di oggi." : "Il motore non forza risultati non adatti. Prova a cambiare interesse, compagnia o tempo disponibile."}</p></div>
      {results.length>0 && <div className="cards">{results.map((item,index)=><article className="card" key={item.id}>{item.imageUrl&&<img src={item.imageUrl} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>}<div className="card-body"><div className="kicker">PROPOSTA {index+1} · {item.availability==="now"?"DISPONIBILE ORA":"PIÙ TARDI OGGI"}</div><h3>{item.name}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<p className="muted">{item.durationMinutes?`${item.durationMinutes} min · `:""}{item.priceFrom!=null?`da € ${item.priceFrom} · `:""}{item.bookingRequirement==="required"?"prenotazione obbligatoria":item.bookingRequirement==="recommended"?"prenotazione consigliata":"senza prenotazione"}</p><Link className="text-link" href={`/esperienze/${item.slug}`}>Scopri la proposta →</Link></div></article>)}</div>}
    </section>}
  </>;
}
