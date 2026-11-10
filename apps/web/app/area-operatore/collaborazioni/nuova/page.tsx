import {redirect} from "next/navigation";
import {createUserServerClient} from "@/lib/supabase/user-server";
import ExperienceCollaborationBuilder from "../../ExperienceCollaborationBuilder";

export const dynamic="force-dynamic";

type Membership={operator_id:string;role:string;operators:{name:string}|{name:string}[]|null};
type SearchParams={operatorId?:string;partnerId?:string};
type DraftExperience={id:string;name:string;published:boolean;review_status:string;operator_id:string;description:string|null;duration_minutes:number|null};

export default async function NewCollaborationPage({searchParams}:{searchParams:Promise<SearchParams>}){
 const params=await searchParams;
 const db=await createUserServerClient();if(!db)redirect("/accedi");
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)redirect("/accedi");
 const {data:memberships}=await db.from("operator_memberships").select("operator_id,role,operators(name)").eq("user_id",userId).in("role",["owner","manager"]);
 const rows=(memberships??[]) as Membership[];if(!rows.length)redirect("/area-operatore");
 const activeRow=(params.operatorId?rows.find(r=>r.operator_id===params.operatorId):null)??rows[0];
 if(params.operatorId&&!rows.some(r=>r.operator_id===params.operatorId))redirect("/area-operatore");
 const [{data:experienceRows},{data:operators}]=await Promise.all([
   db.from("experiences").select("id,name,published,review_status,operator_id,description,duration_minutes").eq("operator_id",activeRow.operator_id).eq("published",false).in("review_status",["draft","rejected"]).order("created_at",{ascending:false}),
   db.from("operators").select("id,name,category").eq("published",true).eq("selection_status","selected").order("name")
 ]);
 const drafts=(experienceRows??[]) as DraftExperience[];
 const draftIds=drafts.map(e=>e.id);
 const {data:mediaRows}=draftIds.length?await db.from("experience_media").select("experience_id,is_cover").in("experience_id",draftIds):{data:[]};
 const withMedia=new Set((mediaRows??[]).filter(m=>m.is_cover).map(m=>m.experience_id));
 const experiences=drafts.filter(e=>Boolean(e.description?.trim())&&Boolean(e.duration_minutes)&&withMedia.has(e.id));
 return <main style={{background:"linear-gradient(180deg,#092d31 0,#10383a 280px,#f3efe6 280px)",minHeight:"75vh",padding:"clamp(28px,5vw,64px) 20px 80px"}}><div className="container" style={{maxWidth:1040}}><a href={`/area-operatore?operatore=${encodeURIComponent(activeRow.operator_id)}`} style={{display:"inline-flex",alignItems:"center",minHeight:44,color:"#fff",fontWeight:600,marginBottom:24}}>← Torna all’Area Operatore</a><header style={{border:"1px solid rgba(202,168,106,.4)",borderRadius:24,padding:"clamp(24px,4vw,44px)",background:"#0a2b30",color:"#fff",boxShadow:"0 14px 32px rgba(0,0,0,.12)"}}><div className="eyebrow" style={{color:"#d9b66d",letterSpacing:2}}>RETE BIMARIS · COLLABORAZIONI</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2rem,4vw,3.4rem)",lineHeight:1.12,margin:"12px 0 14px"}}>Crea una collaborazione</h1><p style={{maxWidth:750,color:"#e5e9e6",lineHeight:1.65,margin:0}}>Completa prima la tua esperienza, poi scegli un partner BIMARIS e descrivi il suo contributo. Il partner dovrà confermare la proposta prima dell’invio alla redazione.</p></header><section style={{background:"#fffdf9",border:"1px solid #e4d8c3",borderRadius:24,padding:"clamp(22px,4vw,40px)",marginTop:24,boxShadow:"0 8px 24px rgba(8,37,39,.07)"}}>{experiences.length===0?<div style={{maxWidth:740}}><div className="eyebrow" style={{color:"#916a31",letterSpacing:1.5}}>PRIMO PASSAGGIO</div><h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.5rem,3vw,2rem)",margin:"10px 0"}}>Prepara un’esperienza da condividere</h2><p style={{lineHeight:1.65,color:"#48595b"}}>Non ci sono ancora bozze complete disponibili. Per invitare un partner, prepara una bozza con descrizione, durata e fotografia di copertina.</p><a href={`/area-operatore?operatore=${encodeURIComponent(activeRow.operator_id)}`} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:46,background:"#caa86a",color:"#092d31",fontWeight:700,borderRadius:999,padding:"10px 24px",marginTop:12}}>Vai alle tue esperienze →</a></div>:<ExperienceCollaborationBuilder operatorId={activeRow.operator_id} experiences={experiences} operators={operators??[]} initialPartnerId={params.partnerId??""}/>}</section></div></main>;
}
