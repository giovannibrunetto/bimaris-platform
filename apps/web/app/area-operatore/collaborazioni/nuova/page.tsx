import {redirect} from "next/navigation";
import {createUserServerClient} from "@/lib/supabase/user-server";
import ExperienceCollaborationBuilder from "../../ExperienceCollaborationBuilder";

export const dynamic="force-dynamic";

type Membership={operator_id:string;role:string;operators:{name:string}|{name:string}[]|null};
export default async function NewCollaborationPage(){
 const db=await createUserServerClient();if(!db)redirect("/accedi");
 const {data:claims}=await db.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)redirect("/accedi");
 const {data:memberships}=await db.from("operator_memberships").select("operator_id,role,operators(name)").eq("user_id",userId).in("role",["owner","manager"]);
 const rows=(memberships??[]) as Membership[];if(!rows.length)redirect("/area-operatore");
 const operatorIds=rows.map(r=>r.operator_id);
 const [{data:experiences},{data:operators}]=await Promise.all([
   db.from("experiences").select("id,name,published,review_status,operator_id").in("operator_id",operatorIds).eq("published",false).in("review_status",["draft","rejected"]).order("created_at",{ascending:false}),
   db.from("operators").select("id,name,category").eq("selection_status","approved").order("name")
 ]);
 return <main style={{background:"var(--sand)",minHeight:"70vh",padding:"clamp(34px,6vw,72px) 20px"}}><div className="container" style={{maxWidth:920}}><a href="/area-operatore" style={{display:"inline-block",marginBottom:22}}>← Area Operatore</a><div className="eyebrow">RETE BIMARIS</div><h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(2.2rem,5vw,4rem)",margin:"8px 0 12px"}}>Crea una collaborazione</h1><p style={{maxWidth:720,color:"var(--muted)",lineHeight:1.6}}>Collega una tua esperienza in bozza a un’altra realtà BIMARIS. Il partner riceverà la richiesta nella propria Area Operatore e dovrà accettarla.</p>{rows.map(row=><ExperienceCollaborationBuilder key={row.operator_id} operatorId={row.operator_id} experiences={(experiences??[]).filter(e=>e.operator_id===row.operator_id)} operators={operators??[]}/>)}</div></main>;
}
