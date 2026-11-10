import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
export async function GET(request:NextRequest) {
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const next=new URL("/admin/password-setup",url.origin);
  if(!code || process.env.NEXT_PUBLIC_SUPABASE_URL!=="https://nzdeoimwikhoidtladnu.supabase.co") {
    next.searchParams.set("error","invalid_link");return NextResponse.redirect(next);
  }
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!key){next.searchParams.set("error","unavailable");return NextResponse.redirect(next);}
  const response=NextResponse.redirect(next);
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(items){items.forEach(({name,value,options})=>{request.cookies.set(name,value);response.cookies.set(name,value,options);});}
    }
  });
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(error){const failed=NextResponse.redirect(new URL("/admin/password-setup?error=expired",url.origin));return failed;}
  return response;
}
