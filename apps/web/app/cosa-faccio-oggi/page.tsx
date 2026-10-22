import Link from "next/link";
import { discoverExperiences, DISCOVERY_AUDIENCES, DISCOVERY_INTENTS, type DiscoveryAudience, type DiscoveryIntent } from "@/lib/discovery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const intentLabels: Record<DiscoveryIntent, { label: string; hint: string }> = {
  culture: { label: "Cultura", hint: "Monumenti, arte e storia" },
  "food-wine": { label: "Sapori", hint: "Degustazioni e territorio" },
  nature: { label: "Natura", hint: "Paesaggi e percorsi" },
  sea: { label: "Mare", hint: "Vivere lo Stretto e la costa" },
  adventure: { label: "Avventura", hint: "Attività ed emozioni" },
  relax: { label: "Relax", hint: "Rallenta e goditi il territorio" },
  "stories-places": { label: "Storie e luoghi", hint: "Miti, borghi e identità" },
};
const audienceLabels: Record<DiscoveryAudience, string> = { solo: "Da solo", couple: "In coppia", friends: "Con amici", family: "In famiglia" };
const durationOptions = [[60,"1 ora"],[120,"2 ore"],[180,"3 ore"],[360,"Mezza giornata"]] as const;
function one(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function validIntent(value?:string):value is DiscoveryIntent{return !!value&&(DISCOVERY_INTENTS as readonly string[]).includes(value);}
function validAudience(value?:string):value is DiscoveryAudience{return !!value&&(DISCOVERY_AUDIENCES as readonly string[]).includes(value);}

const shell: React.CSSProperties={maxWidth:1080,margin:"0 auto",padding:"0 22px"};
const step: React.CSSProperties={border:"1px solid #eadfce",borderRadius:22,padding:"24px",background:"#fff",boxShadow:"0 10px 30px rgba(70,45,25,.05)"};
const grid: React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10};

export default async function DiscoveryTodayPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const intentRaw=one(params.intent);const audienceRaw=one(params.audience);const minutesRaw=Number(one(params.minutes));
 const intent=validIntent(intentRaw)?intentRaw:undefined;const audience=validAudience(audienceRaw)?audienceRaw:undefined;const minutes=durationOptions.some(([v])=>v===minutesRaw)?minutesRaw:undefined;
 const complete=!!intent&&!!audience&&!!minutes;const results=complete?await discoverExperiences({intent,audience,availableMinutes:minutes,limit:3}):[];
 const optionStyle=(active:boolean):React.CSSProperties=>({position:"relative",display:"block",padding:"15px 16px",borderRadius:14,border:active?"2px solid #9b673d":"1px solid #ded7cd",background:active?"#fff7ea":"#fff",cursor:"pointer",minHeight:54,boxSizing:"border-box"});
 return <main style={{background:"#fbf7f0",minHeight:"100vh",paddingBottom:64}}>
  <section style={{background:"linear-gradient(135deg,#211b16 0%,#3a2c20 100%)",color:"#fff",padding:"54px 22px 48px",textAlign:"center"}}>
   <div style={{maxWidth:760,margin:"0 auto"}}><div className="kicker" style={{color:"#e7b25f",letterSpacing:2}}>BIMARIS DISCOVERY</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(38px,6vw,62px)",lineHeight:1.05,margin:"12px 0 14px",color:"#fff"}}>Cosa faccio oggi?</h1><p style={{fontSize:18,lineHeight:1.6,maxWidth:620,margin:"0 auto",color:"#eee4d9"}}>Dicci cosa cerchi. In tre scelte BIMARIS restringe il territorio e ti propone cosa vale la pena vivere oggi.</p><div style={{marginTop:20,fontSize:13,color:"#d9c8b5"}}>3 scelte · pochi secondi · massimo 3 proposte</div></div>
  </section>
  <section style={{...shell,marginTop:-18}}><form method="get" style={{display:"grid",gap:16}}>
   <fieldset style={{...step,border:"1px solid #eadfce"}}><legend style={{padding:"0 8px",fontWeight:700,color:"#8b5a34"}}>1 <span style={{color:"#aa9a89",fontWeight:500}}>·</span> Cosa ti va?</legend><p style={{margin:"0 0 16px",color:"#6d6258"}}>Scegli l'atmosfera che cerchi adesso.</p><div style={grid}>{DISCOVERY_INTENTS.map(key=>{const active=intent===key;return <label key={key} style={optionStyle(active)}><input type="radio" name="intent" value={key} defaultChecked={active} style={{position:"absolute",opacity:0,pointerEvents:"none"}}/><strong style={{display:"block",fontSize:16,color:"#2c251f"}}>{intentLabels[key].label}</strong><span style={{display:"block",fontSize:12,marginTop:4,color:"#81756a"}}>{intentLabels[key].hint}</span></label>})}</div></fieldset>
   <fieldset style={{...step,border:"1px solid #eadfce"}}><legend style={{padding:"0 8px",fontWeight:700,color:"#8b5a34"}}>2 <span style={{color:"#aa9a89",fontWeight:500}}>·</span> Con chi sei?</legend><div style={grid}>{DISCOVERY_AUDIENCES.map(key=>{const active=audience===key;return <label key={key} style={optionStyle(active)}><input type="radio" name="audience" value={key} defaultChecked={active} style={{position:"absolute",opacity:0,pointerEvents:"none"}}/><strong style={{fontSize:15,color:"#2c251f"}}>{audienceLabels[key]}</strong></label>})}</div></fieldset>
   <fieldset style={{...step,border:"1px solid #eadfce"}}><legend style={{padding:"0 8px",fontWeight:700,color:"#8b5a34"}}>3 <span style={{color:"#aa9a89",fontWeight:500}}>·</span> Quanto tempo hai?</legend><div style={grid}>{durationOptions.map(([value,label])=>{const active=minutes===value;return <label key={value} style={optionStyle(active)}><input type="radio" name="minutes" value={value} defaultChecked={active} style={{position:"absolute",opacity:0,pointerEvents:"none"}}/><strong style={{fontSize:15,color:"#2c251f"}}>{label}</strong></label>})}</div></fieldset>
   <button type="submit" style={{border:0,borderRadius:16,padding:"17px 26px",background:"#d89a3d",color:"#211b16",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 10px 24px rgba(171,111,34,.22)",justifySelf:"center",minWidth:240}}>Trova cosa fare →</button>
  </form></section>
  {complete&&<section style={{...shell,marginTop:42}}><div style={{borderTop:"1px solid #e5d9c8",paddingTop:32}}><div className="section-head"><div><div className="kicker">SCELTE BIMARIS</div><h2>{results.length?"Tre idee, non cento":"Nessuna proposta compatibile"}</h2></div><p>{results.length?"Abbiamo eliminato ciò che non è coerente con le tue scelte e con la disponibilità di oggi.":"Non forziamo risultati poco adatti. Cambia una delle tre scelte e riprova."}</p></div>{results.length>0&&<div className="cards">{results.map((item,index)=><article className="card" key={item.id}>{item.imageUrl&&<img src={item.imageUrl} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}}/>}<div className="card-body"><div className="kicker">#{index+1} · {item.availability==="now"?"DISPONIBILE ORA":"PIÙ TARDI OGGI"}</div><h3>{item.name}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<p className="muted">{item.durationMinutes?`${item.durationMinutes} min · `:""}{item.priceFrom!=null?`da € ${item.priceFrom} · `:""}{item.bookingRequirement==="required"?"prenotazione obbligatoria":item.bookingRequirement==="recommended"?"prenotazione consigliata":"senza prenotazione"}</p><Link className="text-link" href={`/esperienze/${item.slug}`}>Scopri la proposta →</Link></div></article>)}</div>}</div></section>}
 </main>;
}
