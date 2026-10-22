import Link from "next/link";
import DiscoveryWizard from "./DiscoveryWizard";
import { discoverExperiences, DISCOVERY_AUDIENCES, DISCOVERY_INTENTS, type DiscoveryAudience, type DiscoveryIntent } from "@/lib/discovery";

export const dynamic="force-dynamic";export const revalidate=0;
const durationOptions=[60,120,180,360] as const;
function one(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function validIntent(value?:string):value is DiscoveryIntent{return !!value&&(DISCOVERY_INTENTS as readonly string[]).includes(value);}
function validAudience(value?:string):value is DiscoveryAudience{return !!value&&(DISCOVERY_AUDIENCES as readonly string[]).includes(value);}

export default async function DiscoveryTodayPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams,intentRaw=one(params.intent),audienceRaw=one(params.audience),minutesRaw=Number(one(params.minutes));
 const intent=validIntent(intentRaw)?intentRaw:undefined,audience=validAudience(audienceRaw)?audienceRaw:undefined,minutes=durationOptions.includes(minutesRaw as typeof durationOptions[number])?minutesRaw:undefined;
 const complete=!!intent&&!!audience&&!!minutes,results=complete?await discoverExperiences({intent,audience,availableMinutes:minutes,limit:3}):[];
 return <main style={{background:"#081d20",minHeight:"100vh"}}>
  <section className="discovery-stage">
   <div className="discovery-light discovery-light-one"/><div className="discovery-light discovery-light-two"/><div className="discovery-grain"/>
   <div className="discovery-shell">
    {!complete&&<div className="discovery-brand"><span>BIMARIS</span><span className="brand-line"/><span>VIVI MESSINA ADESSO</span></div>}
    <DiscoveryWizard initialIntent={intent} initialAudience={audience} initialMinutes={minutes}/>
   </div>
  </section>
  {complete&&<section style={{background:"#fbf7f0",padding:"70px 22px 90px"}}><div style={{maxWidth:1180,margin:"0 auto"}}><div className="section-head"><div><div className="kicker">SCELTE BIMARIS</div><h2>{results.length?"Tre idee, non cento":"Nessuna proposta compatibile"}</h2></div><p>{results.length?"Abbiamo eliminato ciò che non è coerente con le tue scelte e con la disponibilità di oggi.":"Non forziamo risultati poco adatti. Torna alle scelte e cambia ciò che cerchi."}</p></div>{results.length>0&&<div className="cards">{results.map((item,index)=><article className="card" key={item.id}>{item.imageUrl&&<img src={item.imageUrl} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>}<div className="card-body"><div className="kicker">#{index+1} · {item.availability==="now"?"DISPONIBILE ORA":"PIÙ TARDI OGGI"}</div><h3>{item.name}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<p className="muted">{item.durationMinutes?`${item.durationMinutes} min · `:""}{item.priceFrom!=null?`da € ${item.priceFrom} · `:""}{item.bookingRequirement==="required"?"prenotazione obbligatoria":item.bookingRequirement==="recommended"?"prenotazione consigliata":"senza prenotazione"}</p><Link className="text-link" href={`/esperienze/${item.slug}`}>Scopri la proposta →</Link></div></article>)}</div>}</div></section>}
  <style>{`
   .discovery-stage{position:relative;isolation:isolate;overflow:hidden;min-height:${complete?"72vh":"calc(100vh - 42px)"};display:flex;align-items:center;background:linear-gradient(135deg,#071b1f 0%,#0a292d 48%,#0b2427 100%);color:#f7f2e9;padding:clamp(52px,7vh,92px) clamp(22px,5vw,80px)}
   .discovery-stage:before{content:"";position:absolute;inset:0;z-index:-3;background:linear-gradient(112deg,transparent 0 43%,rgba(216,169,79,.035) 49%,transparent 56%)}
   .discovery-light{position:absolute;z-index:-2;border-radius:50%;filter:blur(3px);pointer-events:none;animation:drift 12s ease-in-out infinite alternate}.discovery-light-one{width:72vw;height:72vw;left:-28vw;top:-40vw;background:radial-gradient(circle,rgba(34,91,94,.34),rgba(7,27,31,0) 68%)}.discovery-light-two{width:55vw;height:55vw;right:-22vw;bottom:-35vw;background:radial-gradient(circle,rgba(216,169,79,.07),rgba(7,27,31,0) 67%);animation-duration:16s}.discovery-grain{position:absolute;inset:0;z-index:-1;opacity:.22;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.11) .55px,transparent .55px);background-size:7px 7px;mask-image:linear-gradient(to bottom,transparent,black 20%,black 80%,transparent)}
   .discovery-shell{width:100%;max-width:1320px;margin:0 auto}.discovery-brand{display:flex;align-items:center;justify-content:center;gap:14px;color:#d8a94f;font-size:11px;font-weight:800;letter-spacing:.22em;margin-bottom:clamp(30px,5vh,58px)}.brand-line{width:42px;height:1px;background:rgba(216,169,79,.48)}
   @keyframes drift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(4vw,2vh,0) scale(1.08)}}
   @media(max-width:700px){.discovery-stage{padding-left:18px;padding-right:18px}.discovery-brand{font-size:9px;gap:9px}.brand-line{width:24px}}
   @media(prefers-reduced-motion:reduce){.discovery-light{animation:none!important}}
  `}</style>
 </main>;
}
