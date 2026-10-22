import Link from "next/link";
import DiscoveryWizard from "./DiscoveryWizard";
import { discoverExperiences, DISCOVERY_AUDIENCES, DISCOVERY_INTENTS, type DiscoveryAudience, type DiscoveryIntent } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const durationOptions=[60,120,180,360] as const;
function one(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function validIntent(value?:string):value is DiscoveryIntent{return !!value&&(DISCOVERY_INTENTS as readonly string[]).includes(value);}
function validAudience(value?:string):value is DiscoveryAudience{return !!value&&(DISCOVERY_AUDIENCES as readonly string[]).includes(value);}

export default async function DiscoveryTodayPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams,intentRaw=one(params.intent),audienceRaw=one(params.audience),minutesRaw=Number(one(params.minutes));
 const intent=validIntent(intentRaw)?intentRaw:undefined,audience=validAudience(audienceRaw)?audienceRaw:undefined,minutes=durationOptions.includes(minutesRaw as typeof durationOptions[number])?minutesRaw:undefined;
 const complete=!!intent&&!!audience&&!!minutes,results=complete?await discoverExperiences({intent,audience,availableMinutes:minutes,limit:3}):[];
 return <main style={{background:"#063f40",minHeight:"100vh"}}>
  <section style={{minHeight:complete?"auto":"calc(100vh - 70px)",display:"flex",alignItems:"center",padding:"44px 22px 58px",background:"radial-gradient(circle at 50% 34%,#147575 0%,#0b5b5c 35%,#073f40 68%,#052f31 100%)",color:"#fff",position:"relative",overflow:"hidden"}}>
   <div aria-hidden style={{position:"absolute",inset:"auto -15% -55%",height:"75%",background:"radial-gradient(ellipse at center,rgba(88,170,163,.22),transparent 68%)",pointerEvents:"none"}}/>
   <div style={{width:"100%",maxWidth:1040,margin:"0 auto",position:"relative",zIndex:1}}>
    <header style={{textAlign:"center",marginBottom:complete?24:30}}><div style={{color:"#e0a246",fontSize:11,fontWeight:800,letterSpacing:2.4}}>BIMARIS · VIVI MESSINA ADESSO</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(40px,6vw,64px)",lineHeight:1.02,margin:"12px 0",color:"#fff"}}>Cosa faccio oggi?</h1><p style={{fontSize:"clamp(16px,2vw,19px)",lineHeight:1.55,maxWidth:650,margin:"0 auto",color:"#d5e9e6"}}>Non cercare tra cento cose. Dicci come vuoi sentirti e BIMARIS ti porta verso ciò che vale la pena vivere.</p></header>
    <DiscoveryWizard initialIntent={intent} initialAudience={audience} initialMinutes={minutes}/>
   </div>
  </section>
  {complete&&<section style={{background:"#fbf7f0",padding:"54px 22px 72px"}}><div style={{maxWidth:1080,margin:"0 auto"}}><div className="section-head"><div><div className="kicker">SCELTE BIMARIS</div><h2>{results.length?"Tre idee, non cento":"Nessuna proposta compatibile"}</h2></div><p>{results.length?"Abbiamo eliminato ciò che non è coerente con le tue scelte e con la disponibilità di oggi.":"Non forziamo risultati poco adatti. Torna alle scelte e cambia ciò che cerchi."}</p></div>{results.length>0&&<div className="cards">{results.map((item,index)=><article className="card" key={item.id}>{item.imageUrl&&<img src={item.imageUrl} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>}<div className="card-body"><div className="kicker">#{index+1} · {item.availability==="now"?"DISPONIBILE ORA":"PIÙ TARDI OGGI"}</div><h3>{item.name}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<p className="muted">{item.durationMinutes?`${item.durationMinutes} min · `:""}{item.priceFrom!=null?`da € ${item.priceFrom} · `:""}{item.bookingRequirement==="required"?"prenotazione obbligatoria":item.bookingRequirement==="recommended"?"prenotazione consigliata":"senza prenotazione"}</p><Link className="text-link" href={`/esperienze/${item.slug}`}>Scopri la proposta →</Link></div></article>)}</div>}</div></section>}
 </main>;
}
