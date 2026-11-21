import {createServiceClient} from "@/lib/supabase/server";
type Category="experience"|"profile"|"calendar"|"collaboration"|"communication";
type Input={operatorId:string;category:Category;eventKey:string;title:string;description:string;targetPath?:string};
/** Internal-only best-effort activity notice. A notification failure never rolls back an approved action. */
export async function recordOperatorNotice(input:Input){
 if(!input.operatorId||!input.eventKey)return false;
 const db=createServiceClient();
 if(!db)return false;
 const path=input.targetPath??"/area-operatore";
 if(!path.startsWith("/area-operatore")||path.includes("//"))return false;
 const {error}=await db.from("operator_notifications").upsert({
  operator_id:input.operatorId,category:input.category,event_key:input.eventKey.slice(0,180),
  title:input.title.slice(0,160),description:input.description.slice(0,1000),target_path:path
 },{onConflict:"operator_id,event_key",ignoreDuplicates:true});
 if(error){console.error("OP-NOTIFY record failed",error.message);return false;}
 return true;
}
