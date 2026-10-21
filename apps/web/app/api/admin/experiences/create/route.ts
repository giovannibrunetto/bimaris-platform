import {NextRequest,NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {createServiceClient} from "@/lib/supabase/server";

function text(v:FormDataEntryValue|null,max:number){return typeof v==="string"?v.trim().slice(0,max):""}
function slugify(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)}
function num(v:string){if(!v)return null;const n=Number(v.replace(",","."));return Number.isFinite(n)?n:null}
function back(req:NextRequest,state:string){return NextResponse.redirect(new URL(`/admin/esperienze/nuova?state=${encodeURIComponent(state)}`,req.url),303)}
function jsonMode(req:NextRequest){return req.headers.get("sec-fetch-dest")!=="document"}
function fail(req:NextRequest,state:string,status=400){return jsonMode(req)?NextResponse.json({ok:false,error:state},{status}):back(req,state)}

export async function POST(request:NextRequest){
 if(!(await isAdminAuthenticated()))return jsonMode(request)?NextResponse.json({ok:false,error:"unauthorized"},{status:401}):NextResponse.redirect(new URL("/admin/login",request.url),303);
 const db=createServiceClient();if(!db)return fail(request,"error",500);
 let createdId:string|null=null;const uploadedPaths:string[]=[];
 try{
  const form=await request.formData();
  const name=text(form.get("name"),200),operatorId=text(form.get("operator_id"),80),categoryId=text(form.get("category_id"),80),territoryId=text(form.get("territory_id"),80),excerpt=text(form.get("excerpt"),300),description=text(form.get("description"),5000),whySelected=text(form.get("why_selected"),3000),origin=text(form.get("experience_origin"),30)==="bimaris"?"bimaris":"admin_on_behalf";
  let operatorIds:string[]=[];try{const parsed=JSON.parse(text(form.get("operator_ids"),4000));if(Array.isArray(parsed))operatorIds=parsed.filter((v):v is string=>typeof v==="string"&&v.length>0)}catch{}
  if(!operatorIds.length&&operatorId)operatorIds=[operatorId];operatorIds=[...new Set(operatorIds)];
  if(!name||!operatorId||!categoryId||!territoryId||!excerpt||!description||!whySelected||!operatorIds.length)return fail(request,"invalid-data");
  const {data:validOperators,error:operatorError}=await db.from("operators").select("id,selection_status").in("id",operatorIds);
  if(operatorError||!validOperators||validOperators.length!==operatorIds.length||validOperators.some(o=>o.selection_status!=="selected"))return fail(request,"invalid-operator");
  const photos=form.getAll("photos").filter((v):v is File=>v instanceof File&&v.size>0).slice(0,6);
  const expectedRaw=Number(text(form.get("expected_photo_count"),2));const expectedPhotos=Number.isInteger(expectedRaw)?Math.max(0,Math.min(6,expectedRaw)):photos.length;
  if(photos.length!==expectedPhotos)return fail(request,"photo-count-mismatch");
  const allowed=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
  if(photos.some(file=>!allowed.has(file.type)||file.size>20*1024*1024))return fail(request,"invalid-photo");
  const duration=num(text(form.get("duration_minutes"),20)),price=num(text(form.get("price_from"),30));
  const {data:created,error}=await db.from("experiences").insert({operator_id:operatorId,experience_origin:origin,name,slug:`${slugify(name)}-${Date.now().toString(36)}`,category_id:categoryId,territory_id:territoryId,excerpt,description,why_selected:whySelected,duration_minutes:duration==null?null:Math.max(1,Math.round(duration)),price_from:price==null?null:Math.max(0,price),meeting_point:text(form.get("meeting_point"),500)||null,bookable:form.get("bookable")==="yes",published:false,review_status:"draft",draft_step:4,updated_at:new Date().toISOString()}).select("id").single();
  if(error||!created)throw error??new Error("experience-create-failed");createdId=created.id;
  const participants=operatorIds.map((id,i)=>({experience_id:created.id,operator_id:id,role:i===0?"lead":"participant"}));
  const {error:participantsError}=await db.from("experience_operators").upsert(participants,{onConflict:"experience_id,operator_id"});if(participantsError)throw participantsError;
  let coverUrl:string|null=null;
  for(let i=0;i<photos.length;i++){
   const file=photos[i],ext=(file.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase()||"jpg",path=`${operatorId}/${created.id}/admin-${Date.now()}-${i}.${ext}`;
   const upload=await db.storage.from("experience-media").upload(path,file,{upsert:false,contentType:file.type});if(upload.error)throw new Error(`photo-upload-failed:${i}`);uploadedPaths.push(path);
   const {error:mediaError}=await db.from("experience_media").insert({experience_id:created.id,storage_path:path,sort_order:i,is_cover:i===0,alt_text:`${name} - foto ${i+1}`});if(mediaError)throw mediaError;
   if(i===0)coverUrl=db.storage.from("experience-media").getPublicUrl(path).data.publicUrl;
  }
  if(coverUrl){const {error:coverError}=await db.from("experiences").update({image_url:coverUrl,image_alt:`${name} - copertina`}).eq("id",created.id);if(coverError)throw coverError;}
  if(jsonMode(request))return NextResponse.json({ok:true,id:created.id,url:`/admin/operatori?state=experience-created&id=${encodeURIComponent(created.id)}`});
  return NextResponse.redirect(new URL(`/admin/operatori?state=experience-created&id=${encodeURIComponent(created.id)}`,request.url),303);
 }catch(error){
  console.error("Admin wizard create failed",{stage:"create-experience",createdId,error});
  if(uploadedPaths.length)await db.storage.from("experience-media").remove(uploadedPaths);
  if(createdId)await db.from("experiences").delete().eq("id",createdId);
  return fail(request,"error",500);
 }
}
