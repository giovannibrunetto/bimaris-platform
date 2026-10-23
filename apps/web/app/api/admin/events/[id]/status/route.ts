import { NextRequest,NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated()))return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const {id}=await params;const form=await request.formData();const action=form.get("action");if(action!=="approve"&&action!=="reject")return NextResponse.redirect(new URL("/admin/eventi?status=invalid",request.url),303);
 const db=createServiceClient();if(!db)return NextResponse.redirect(new URL("/admin/eventi?status=error",request.url),303);
 const update=action==="approve"?{verification_status:"verified",published:true}:{verification_status:"rejected",published:false};
 const {error}=await db.from("events").update(update).eq("id",id).eq("verification_status","pending");
 return NextResponse.redirect(new URL(`/admin/eventi?status=${error?"error":action==="approve"?"approved":"rejected"}`,request.url),303);
}
