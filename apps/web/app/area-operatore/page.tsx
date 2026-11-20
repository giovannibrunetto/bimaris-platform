import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";
import ExperienceManager from "./ExperienceManager";
import OperatorProfileEditor from "./OperatorProfileEditor";
import CollaborationInbox from "./CollaborationInbox";
import WizardReviewGuide from "./WizardReviewGuide";
import OperatorLogoutButton from "./OperatorLogoutButton";
import OperatorWorkspaceSwitcher from "./OperatorWorkspaceSwitcher";
import OperatorWorkspacePanels from "./OperatorWorkspacePanels";
import "./operator-area.css";
export const dynamic="force-dynamic";export const revalidate=0;
type Operator={id:string;slug:string;name:string;category:string|null;published:boolean;selection_status:string;address:string|null;phone:string|null;whatsapp:string|null;email:string|null;website:string|null;instagram:string|null};
type Membership={role:string;operator_id:string;operators:Operator|Operator[]|null};type Metric={total:number;whatsapp:number;phone:number;directions:number;website:number;instagram:number;booking:number};type ReviewSections={name?:string;excerpt?:string;basics?:string;description?:string;details?:string;media?:string;location?:string};type Experience={id:string;name:string;excerpt:string|null;description:string|null;duration_minutes:number|null;price_from:number|null;category_id:string|null;territory_id:string|null;locality:string|null;meeting_point:string|null;google_maps_place_id:string|null;latitude:number|null;longitude:number|null;location_kind:"venue"|"departure"|null;published:boolean;review_status:string;review_notes:string|null;review_sections:ReviewSections|null;draft_step:number};type Option={id:string;name:string};type KeyOption={key:string;label:string};type Collaboration={experience_id:string;operator_id:string;activity_label:string|null;approval_status:string};
function relatedOperator(v:Operator|Operator[]|null){return Array.isArray(v)?v[0]??null:v;}
function correctionStep(sections:ReviewSections|null,fallback:number){if(!sections)return fallback;if(sections.name||sections.excerpt||sections.basics)return 0;if(sections.description)return 1;if(sections.details||sections.location)return 2;if(sections.media)return 3;return fallback;}
function cleanReviewNote(note:string|null){return note?.replace(/^Nota generale:\s*/i,"")??null;}
const metricCard={padding:"20px 18px",border:"1px solid rgba(202,168,106,.22)",borderRadius:16,background:"#fbfaf7",display:"grid",gap:7,minWidth:0};
export default async function OperatorAreaPage({searchParams}:{searchParams:Promise<{operatore?:string;collaboration?:string;experience?:string;step?:string;invito?:string}>}){const requestedParams=await searchParams;
 const returnQuery=new URLSearchParams();
 for(const [key,value] of Object.entries(requestedParams)){
  if(typeof value==="string"&&["operatore","experience","step","collaboration","invito"].includes(key))returnQuery.set(key,value);
 }
 const returnPath="/area-operatore"+(returnQuery.size?"?"+returnQuery.toString():"");
 const signInUrl="/accedi?next="+encodeURIComponent(returnPath);
 const userClient=await createUserServerClient();if(!userClient)redirect(signInUrl);const {data:claimsData}=await userClient.auth.getClaims();const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;if(!userId)redirect(signInUrl);
 const {data:membershipsData}=await userClient.from("operator_memberships").select("role,operator_id,operators(id,slug,name,category,published,selection_status,address,phone,whatsapp,email,website,instagram)").eq("user_id",userId);const memberships=(membershipsData??[]) as Membership[];const rows=memberships.map(r=>({role:r.role,operator_id:r.operator_id,operator:relatedOperator(r.operators)})).filter(r=>r.operator!==null) as {role:string;operator_id:string;operator:Operator}[];
 const params=await searchParams;const requested=params.operatore;
 const matchedRow=requested?rows.find(r=>r.operator_id===requested||r.operator.slug===requested):null;
 if(requested&&!matchedRow){
  return <main className="container" style={{maxWidth:750,padding:"72px 20px",minHeight:"65vh"}}>
   <section className="card" role="alert" style={{padding:32}}>
    <div className="eyebrow">ACCESSO OPERATORE</div>
    <h1>Questo operatore non è associato al tuo account.</h1>
    <p>La sessione attiva appartiene a un altro account. Per gestire l'operatore richiesto, esci e accedi con l'account autorizzato.</p>
    <OperatorLogoutButton/>
   </section>
  </main>;
 }
 const activeRow=matchedRow??rows[0]??null;const visibleRows=activeRow?[activeRow]:[];
 const operatorIds=rows.map(r=>r.operator_id);const [{data:experienceData},{data:territoriesData},{data:intentsData},{data:activitiesData},{data:profileRevisionData},{data:collaborationData}]=await Promise.all([operatorIds.length?userClient.from("experiences").select("id,operator_id,name,excerpt,description,duration_minutes,price_from,category_id,territory_id,published,review_status,review_notes,review_sections,locality,meeting_point,google_maps_place_id,latitude,longitude,location_kind,draft_step,category:categories(slug,name),interests:experience_discovery_intents(intent_key),activities:experience_activity_links(activity_key)").in("operator_id",operatorIds).order("created_at",{ascending:false}):Promise.resolve({data:[]}),userClient.from("territories").select("id,name").eq("active",true).order("name"),userClient.from("discovery_intents").select("key,label").eq("active",true).order("sort_order"),userClient.from("experience_activities").select("key,label").eq("active",true).order("sort_order"),operatorIds.length?userClient.from("operator_revisions").select("operator_id").in("operator_id",operatorIds).eq("status","pending"):Promise.resolve({data:[]}),operatorIds.length?userClient.from("experience_operators").select("experience_id,operator_id,activity_label,approval_status").in("operator_id",operatorIds).eq("role","participant").eq("approval_status","pending").order("created_at",{ascending:false}):Promise.resolve({data:[]})]);const territories=(territoriesData??[]) as Option[],interests=(intentsData??[]) as KeyOption[],activities=(activitiesData??[]) as KeyOption[];const pendingProfileOperators=new Set((profileRevisionData??[]).map(r=>r.operator_id));const experiencesByOperator=new Map<string,Experience[]>();for(const e of experienceData??[]){const source=e as Experience&{operator_id:string};const row:Experience&{operator_id:string}={...source,draft_step:source.review_status==="rejected"?correctionStep(source.review_sections,source.draft_step):source.draft_step,review_notes:cleanReviewNote(source.review_notes)};experiencesByOperator.set(row.operator_id,[...(experiencesByOperator.get(row.operator_id)??[]),row]);}
 const collaborationRows=(collaborationData??[]) as Collaboration[];
 // RLS authorizes the partner to see an invitation, not the unpublished
 // experience itself. Resolve names server-side only for the authorized IDs.
 const service=createServiceClient();
 const invitationIds=[...new Set(collaborationRows.map(c=>c.experience_id))];
 const invitationExperiences=service&&invitationIds.length
  ?await service.from("experiences").select("id,name,operator_id").in("id",invitationIds)
  :{data:[] as {id:string;name:string;operator_id:string}[]};
 const experienceById=new Map((invitationExperiences.data??[]).map(e=>[e.id,e]));
 const proposingIds=[...new Set([...experienceById.values()].map(e=>e.operator_id).filter((id):id is string=>Boolean(id)))];
 const slugs=rows.map(r=>r.operator.slug);
 const [proposingResult,metricResult]=await Promise.all([
  service&&proposingIds.length?service.from("operators").select("id,name").in("id",proposingIds):Promise.resolve({data:[]}),
  service&&slugs.length?service.rpc("get_operator_action_metrics",{p_operator_slugs:slugs,p_window_days:30}):Promise.resolve({data:[]})
 ]);
 const proposingNames=new Map((proposingResult.data??[]).map(o=>[o.id,o.name]));
 const collaborationsByOperator=new Map<string,{experience_id:string;operator_id:string;activity_label:string|null;approval_status:string;experience_name:string;proposing_operator_name:string}[]>();
 for(const c of collaborationRows){
  const e=experienceById.get(c.experience_id);
  const item={experience_id:c.experience_id,operator_id:c.operator_id,activity_label:c.activity_label,approval_status:c.approval_status,experience_name:e?.name??"Esperienza BIMARIS",proposing_operator_name:e?proposingNames.get(e.operator_id)??"Un operatore BIMARIS":"Un operatore BIMARIS"};
  collaborationsByOperator.set(c.operator_id,[...(collaborationsByOperator.get(c.operator_id)??[]),item]);
 }
 const metrics=new Map<string,Metric>(slugs.map(s=>[s,{total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0}]));for(const row of metricResult.data??[]){if(!row.operator_slug||!metrics.has(row.operator_slug))continue;metrics.set(row.operator_slug,{total:Number(row.total??0),whatsapp:Number(row.whatsapp??0),phone:Number(row.phone??0),directions:Number(row.directions??0),website:Number(row.website??0),instagram:Number(row.instagram??0),booking:Number(row.booking??0)});}
 return <main className="operator-premium-area"><div className="operator-premium-shell">
 {rows.length===0?<section className="operator-premium-empty"><h1>Nessuna attività collegata</h1><p>Il tuo account è attivo, ma non è ancora associato a un operatore BIMARIS.</p><OperatorLogoutButton/></section>:<>
 {activeRow&&<header className="operator-premium-header">
  <div className="operator-premium-heading"><div className="operator-premium-kicker">IL TUO SPAZIO · BIMARIS</div><h1>{activeRow.operator.name}</h1><p>Gestisci la tua attività e le esperienze su BIMARIS.</p></div>
  <div className="operator-premium-header__actions"><span className="operator-premium-status">{activeRow.operator.published?"Profilo online":"Profilo non pubblicato"}</span>{activeRow.operator.published&&<a href={`/operatori/${activeRow.operator.slug}`} className="operator-premium-public">Scheda pubblica ↗</a>}<OperatorLogoutButton/></div>
 </header>}
 {activeRow&&<OperatorWorkspaceSwitcher activities={rows.map(r=>({id:r.operator_id,slug:r.operator.slug,name:r.operator.name}))} selectedSlug={activeRow.operator.slug}/>}
 {visibleRows.map(({role,operator_id,operator})=>{
  const m=metrics.get(operator.slug)??{total:0,whatsapp:0,phone:0,directions:0,website:0,instagram:0,booking:0};
  const operatorExperiences=experiencesByOperator.get(operator_id)??[];
  const canManage=["owner","manager"].includes(role);
  const pendingCollaborations=collaborationsByOperator.get(operator_id)??[];
  const cards=[["Persone in azione",m.total],["WhatsApp",m.whatsapp],["Prenotazioni",m.booking],["Come raggiungerti",m.directions],["Telefonate",m.phone],["Visite al sito",m.website],["Instagram",m.instagram]] as const;
  return <OperatorWorkspacePanels key={operator_id}
    initialTab={params.collaboration?"collaborations":"experiences"}
    collaborationCount={pendingCollaborations.length}
    collaborations={canManage&&(pendingCollaborations.length>0||Boolean(params.collaboration))?<CollaborationInbox operatorId={operator_id} items={pendingCollaborations}/>:undefined}
    experiences={canManage?<div className="operator-experiences"><ExperienceManager operatorId={operator_id} experiences={operatorExperiences} interests={interests} activities={activities} territories={territories} initialExperienceId={params.experience} initialStep={params.step==="collaborazione"?5:undefined}/><WizardReviewGuide experiences={operatorExperiences}/></div>:<section className="operator-experiences" aria-label="Accesso in sola lettura"><h2>Le tue esperienze</h2><p>La gestione delle esperienze è riservata ai titolari e ai manager dell'attività.</p></section>}
    profile={canManage?<OperatorProfileEditor operator={operator} pending={pendingProfileOperators.has(operator_id)}/>:<section className="operator-profile-card"><h2>Profilo dell'attività</h2><p>Puoi consultare questa attività. Le modifiche sono riservate ai titolari e ai manager.</p></section>}
    impact={<section className="operator-impact"><div className="operator-impact__head"><div><div className="eyebrow">Il tuo impatto</div><h2>Le persone che si avvicinano alla tua realtà</h2></div>{operator.published&&<span>Ultimi 30 giorni</span>}</div>{operator.published?<div className="operator-impact__metrics">{cards.map(([label,value])=><div key={label} style={metricCard}><strong>{value}</strong><span>{label}</span></div>)}</div>:<p className="operator-impact__waiting">Le statistiche saranno disponibili quando la tua realtà sarà online.</p>}</section>}
   />
 })}
 </>}
 </div></main>
