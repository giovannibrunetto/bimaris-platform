import Link from "next/link";
import DiscoveryWizard from "./DiscoveryWizard";
import { discoverExperiences, DISCOVERY_AUDIENCES, DISCOVERY_INTENTS, type DiscoveryAudience, type DiscoveryIntent } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const durationOptions = [60,120,180,360] as const;
function one(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function validIntent(value?:string):value is DiscoveryIntent{return !!value&&(DISCOVERY_INTENTS as readonly string[]).includes(value);}
function validAudience(value?:string):value is DiscoveryAudience{return !!value&&(DISCOVERY_AUDIENCES as readonly string[]).includes(value);}

export default async function DiscoveryTodayPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const intentRaw=one(params.intent);const audienceRaw=one(params.audience);const minutesRaw=Number(one(params.minutes));
 const intent=validIntent(intentRaw)?intentRaw:undefined;
 const audience=validAudience(audienceRaw)?audienceRaw:undefined;
 const minutes=durationOptions.includes(minutesRaw as typeof durationOptions[number])?minutesRaw:undefined;
 const complete=!!intent&&!!audience&&!!minutes;
 const results=complete?await discoverExperiences({intent,audience,availableMinutes:minutes,limit:3}):[];
 return <main style={{background:"#211b16",minHeight:"100vh"}}>
  <section style={{minHeight:complete?"auto":"calc(100vh - 70px)",display:"flex",alignItems:"center",padding:"52px 22px 64px",background:"radial-gradient(circle at 50% 35%,#493626 0%,#2d231c 42%,#1d1916 100%)",color:"#fff"}}>
   <div style={{width:"100%",maxWidth:1040,margin:"0 auto"}}>
    <header style={{textAlign:"center",marginBottom:complete?30:42}}><div style={{color:"#e0a246",fontSize:11,fontWeight:800,letterSpacing:2.4}}>BIMARIS · VIVI MESSINA ADESSO</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(40px,6vw,66px)",lineHeight:1.02,margin:"12px 0 12px",color:"#fff"}}>Cosa faccio oggi?</h1><p style={{fontSize:"clamp(16px,2vw,19px)",lineHeight:1.55,maxWidth:650,margin:"0 auto",color:"#dfd3c7"}}>Non cercare tra cento cose. Dicci come vuoi sentirti e BIMARIS ti porta verso ciò che vale la pena vivere.</p></header>
    <DiscoveryWizard initialIntent={intent} initialAudience={audience} initialMinutes={minutes}/>
   </div>
  </section>
  {complete&&<section style={{background:"#fbf7f0",padding:"54px 22px 72px"}}><div style={{maxWidth:1080,margin:"0 auto"}}><div className="section-head"><div><div className="kicker">SCELTE BIMARIS</div><h2>{results.length?"Tre idee, non cento":"Nessuna proposta compatibile"}</h2></div><p>{results.length?"Abbiamo eliminato ciò che non è coerente con le tue scelte e con la disponibilità di oggi.":"Non forziamo risultati poco adatti. Torna alle scelte e cambia ciò che cerchi."}</p></div>{results.length>0&&<div className="cards">{results.map((item,index)=><article className="card" key={item.id}>{item.imageUrl&&<img src={item.imageUrl} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>}<div className="card-body"><div className="kicker">#{index+1} · {item.availability==="now"?"DISPONIBILE ORA":"PIÙ TARDI OGGI"}</div><h3>{item.name}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<p className="muted">{item.durationMinutes?`${item.durationMinutes} min · `:""}{item.priceFrom!=null?`da € ${item.priceFrom} · `:""}{item.bookingRequirement==="required"?"prenotazione obbligatoria":item.bookingRequirement==="recommended"?"prenotazione consigliata":"senza prenotazione"}</p><Link className="text-link" href={`/esperienze/${item.slug}`}>Scopri la proposta →</Link></div></article>)}</div>}</div></section>}
 </main>;
}
