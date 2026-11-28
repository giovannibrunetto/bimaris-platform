import {NextRequest,NextResponse} from "next/server";
import {reconcileB2BNotifications} from "@/lib/b2b-notifications";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const result=await reconcileB2BNotifications();
  return NextResponse.json({ok:true,...result});
 }catch(error){
  console.error("B2B cron reconciliation failed",error);
  return NextResponse.json({error:"Reconciliation failed"},{status:500});
 }
}
