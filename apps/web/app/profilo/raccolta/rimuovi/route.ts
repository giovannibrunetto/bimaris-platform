import { NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";

export async function POST(request:Request){
 const supabase=await createUserServerClient();
 if(!supabase)return NextResponse.redirect(new URL("/accedi",request.url),303);
 const{data:claimsData}=await supabase.auth.getClaims();
 const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
 if(!userId)return NextResponse.redirect(new URL("/accedi",request.url),303);
 const form=await request.formData();
 const itemType=String(form.get("item_type")??"").trim();
 const itemId=String(form.get("item_id")??"").trim();
 if(!itemType||!itemId)return NextResponse.redirect(new URL("/profilo/raccolta?errore=1",request.url),303);
 const{error}=await supabase.from("user_saved_items").delete().eq("user_id",userId).eq("item_type",itemType).eq("item_id",itemId);
 return NextResponse.redirect(new URL(error?"/profilo/raccolta?errore=1":"/profilo/raccolta?rimosso=1",request.url),303);
}
