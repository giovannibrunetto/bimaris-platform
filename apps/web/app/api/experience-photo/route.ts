import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { isAuthorizedAdmin } from "@/lib/admin-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const headers = {"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"};
const missing = () => new NextResponse(null,{status:404,headers});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
 const path = request.nextUrl.searchParams.get("path") ?? "";
 const revision = request.nextUrl.searchParams.get("revision") === "1";
 const parts = path.split("/");
 if (path.length > 1024 || parts.some(p=>!p || p==="." || p===".." || /[\\\x00-\x1f]/.test(p))) return missing();
 if (revision ? parts.length!==4 || !uuid.test(parts[0]) || parts[1]!=="revisions" || !uuid.test(parts[2]) : parts.length!==3 || !uuid.test(parts[0]) || !uuid.test(parts[1])) return missing();
 const db = createServiceClient();
 if (!db) return missing();
 try {
  const bucket = revision ? "experience-revision-media" : "experience-media";
  const {data: rows,error} = revision
   ? await db.from("experience_revision_media").select("operator_id,revision_id").eq("storage_path",path)
   : await db.from("experience_media").select("experience_id").eq("storage_path",path);
  if(error || !rows?.length) return missing();
  let allowed = false;
  const operatorIds = new Set<string>();
  if(revision){
   for(const row of rows as unknown as {operator_id:string;revision_id:string}[]){
    if(row.operator_id===parts[0] && row.revision_id===parts[2]) operatorIds.add(row.operator_id);
   }
  }else{
   const ids = (rows as unknown as {experience_id:string}[]).map(row=>row.experience_id);
   const {data: experiences,error: experienceError} = await db.from("experiences").select("operator_id,published,review_status,operator:operators!experiences_operator_id_fkey(published,selection_status)").in("id",ids);
   if(experienceError) return missing();
   for(const experience of experiences??[]){
    if(experience.operator_id) operatorIds.add(experience.operator_id);
    const operator = Array.isArray(experience.operator)?experience.operator[0]:experience.operator;
    if(experience.published && experience.review_status==="approved" && operator?.published && operator.selection_status==="selected") allowed=true;
   }
  }
  if(!allowed && operatorIds.size){
   const userClient = await createUserServerClient();
   if(userClient){
    const {data: auth} = await userClient.auth.getUser();
    if(auth.user){
     const {data: memberships,error: membershipError} = await userClient.from("operator_memberships").select("operator_id").eq("user_id",auth.user.id).in("operator_id",[...operatorIds]).in("role",["owner","manager"]);
     if(!membershipError && memberships?.length) allowed=true;
    }
   }
   if(!allowed) allowed=await isAuthorizedAdmin();
  }
  if(!allowed) return missing();
  const {data: file,error: downloadError} = await db.storage.from(bucket).download(path);
  if(downloadError || !file) return missing();
  const type = file.type.toLowerCase().split(";")[0];
  if(!["image/webp","image/jpeg","image/png","image/gif","image/avif"].includes(type)) return missing();
  return new NextResponse(file,{headers:{...headers,"Content-Type":type}});
 }catch{return missing()}
}
