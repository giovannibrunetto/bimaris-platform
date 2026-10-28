import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const one=<T,>(value:T|T[]|null|undefined):T|null=>Array.isArray(value)?(value[0]??null):(value??null);
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated()))return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;const db=createServiceClient();if(!db)return NextResponse.json({error:"Supabase non configurato"},{status:500});
 const {data:experience}=await db.from("experiences").select("id").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
 if(!experience)return NextResponse.json({participants:[]});
 const {data,error}=await db.from("experience_operators").select("operator_id,role,activity_label,approval_status,approved_at,operator:operators(name)").eq("experience_id",experience.id).order("created_at");
 if(error){console.error("Admin collaboration load failed",error);return NextResponse.json({error:"Impossibile caricare la collaborazione"},{status:500})}
 const participants=(data??[]).map((row:any)=>({operator_id:row.operator_id,name:one(row.operator)?.name??"Operatore",role:row.role,activity_label:row.activity_label,approval_status:row.approval_status,approved_at:row.approved_at}));
 return NextResponse.json({participants},{headers:{"Cache-Control":"no-store"}});
}
