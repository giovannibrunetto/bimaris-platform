import {NextRequest,NextResponse} from "next/server";
import {createUserServerClient} from "@/lib/supabase/user-server";
import {classifyPoint} from "@/lib/territory-geo";

export async function POST(request:NextRequest){
 const userClient=await createUserServerClient();
 if(!userClient)return NextResponse.json({error:"Servizio non disponibile"},{status:503});
 const {data:claims}=await userClient.auth.getClaims();
 const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;
 if(!userId)return NextResponse.json({error:"Accesso richiesto"},{status:401});
 let input:{operatorId?:unknown;latitude?:unknown;longitude?:unknown};
 try{input=await request.json()}catch{return NextResponse.json({error:"Richiesta non valida"},{status:400})}
 const operatorId=typeof input.operatorId==="string"?input.operatorId:"";
 const latitude=Number(input.latitude),longitude=Number(input.longitude);
 if(!/^[0-9a-f-]{36}$/i.test(operatorId)||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){
  return NextResponse.json({error:"Coordinate o operatore non validi"},{status:400});
 }
 const {data:membership}=await userClient.from("operator_memberships").select("role").eq("operator_id",operatorId).eq("user_id",userId).in("role",["owner","manager"]).maybeSingle();
 if(!membership)return NextResponse.json({error:"Operatore non autorizzato"},{status:403});
 const result=await classifyPoint(latitude,longitude);
 return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
}
