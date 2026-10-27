import { NextRequest,NextResponse } from "next/server";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";

const MONTHS:Record<string,number>={gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12};
function lastSunday(year:number,month:number){const d=new Date(Date.UTC(year,month,0));return d.getUTCDate()-d.getUTCDay();}
function romeOffset(year:number,month:number,day:number){const start=lastSunday(year,3),end=lastSunday(year,10);return month>3&&month<10||month===3&&day>=start||month===10&&day<end?"+02:00":"+01:00";}
function inferYear(month:number,day:number){const now=new Date();let year=now.getUTCFullYear();const candidate=Date.UTC(year,month-1,day);if(candidate<now.getTime()-30*86400000)year++;return year;}
function isValidCivilDate(year:number,month:number,day:number){if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1)return false;const d=new Date(Date.UTC(year,month-1,day));return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;}
function parseDate(text:string){let m=text.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/);if(m){const day=Number(m[1]),month=Number(m[2]);let year=m[3]?Number(m[3]):inferYear(month,day);if(year<100)year+=2000;if(!isValidCivilDate(year,month,day))return null;return{day,month,year,raw:m[0]};}
 m=text.toLowerCase().match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/);if(!m)return null;const month=MONTHS[m[2]],day=Number(m[1]),year=m[3]?Number(m[3]):inferYear(month,day);if(!isValidCivilDate(year,month,day))return null;return{day,month,year,raw:m[0]};}
function parseTime(text:string){const m=text.match(/(?:ore\s*)?\b([01]?\d|2[0-3])(?:[:.]([0-5]\d))\b/i)||text.match(/\bore\s+([01]?\d|2[0-3])\b/i);return m?{hour:Number(m[1]),minute:Number(m[2]||0),raw:m[0]}:{hour:9,minute:0,raw:""};}
function cleanTitle(block:string,dateRaw:string,timeRaw:string){const first=block.split(/\n+/).map(s=>s.trim()).filter(Boolean)[0]||"Attività";let title=first.replace(dateRaw,"").replace(timeRaw,"").replace(/^[\s\-–—|:]+|[\s\-–—|:]+$/g,"").replace(/\s{2,}/g," ");title=title.replace(/^(lun(?:edì)?|mar(?:tedì)?|mer(?:coledì)?|gio(?:vedì)?|ven(?:erdì)?|sab(?:ato)?|dom(?:enica)?)\s*/i,"").replace(/^[\-–—|:]+\s*/,"");if(title.length<3){const next=block.split(/\n+/).map(s=>s.trim()).find(s=>s.length>3&&!s.includes(dateRaw));if(next)title=next;}return title.slice(0,180)||"Attività";}
function extractBlocks(raw:string){const lines=raw.replace(/\r/g,"").split("\n").map(s=>s.trim()).filter(Boolean);const blocks:string[]=[];let current:string[]=[];for(const line of lines){if(parseDate(line)&&current.length){blocks.push(current.join("\n"));current=[line];}else current.push(line);}if(current.length)blocks.push(current.join("\n"));return blocks.filter(b=>parseDate(b));}
function normalizedTitle(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}

export async function POST(request:NextRequest){
 const userDb=await createUserServerClient();if(!userDb)return NextResponse.json({error:"Accesso richiesto"},{status:401});
 const {data:claims}=await userDb.auth.getClaims();const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;if(!userId)return NextResponse.json({error:"Accesso richiesto"},{status:401});
 const body=await request.json().catch(()=>null) as {operator_id?:string;raw_text?:string;source_type?:string}|null;const operatorId=body?.operator_id?.trim(),raw=body?.raw_text?.trim();if(!operatorId||!raw)return NextResponse.json({error:"Calendario mancante"},{status:400});if(raw.length>12000)return NextResponse.json({error:"Il calendario è troppo lungo"},{status:400});
 const {data:membership}=await userDb.from("operator_memberships").select("role").eq("operator_id",operatorId).eq("user_id",userId).maybeSingle();if(!membership||!["owner","manager"].includes(membership.role))return NextResponse.json({error:"Non autorizzato"},{status:403});
 const service=createServiceClient();if(!service)return NextResponse.json({error:"Servizio non disponibile"},{status:503});
 const blocks=extractBlocks(raw);if(blocks.length===0)return NextResponse.json({error:"Non riesco a individuare date valide nel testo. Inserisci almeno una data reale, ad esempio 3 novembre o 03/11."},{status:422});
 const sourceType=body?.source_type==="manual"?"manual":"whatsapp";
 const {data:batch,error:batchError}=await service.from("event_import_batches").insert({operator_id:operatorId,submitted_by:userId,source_type:sourceType,raw_text:raw,status:"pending"}).select("id").single();if(batchError||!batch)return NextResponse.json({error:"Impossibile salvare il calendario"},{status:500});
 const parsedRows=blocks.map(block=>{const d=parseDate(block)!;const t=parseTime(block);const startsAt=`${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}T${String(t.hour).padStart(2,"0")}:${String(t.minute).padStart(2,"0")}:00${romeOffset(d.year,d.month,d.day)}`;return{operator_id:operatorId,title:cleanTitle(block,d.raw,t.raw),description:block,starts_at:startsAt,published:false,verification_status:"pending",source_type:sourceType,source_label:sourceType==="whatsapp"?"Calendario inviato dall'operatore":"Inserimento manuale operatore",import_batch_id:batch.id,metadata:{raw_block:block,parser_version:3}};});
 const starts=[...new Set(parsedRows.map(row=>row.starts_at))];
 const {data:existing}=starts.length?await service.from("events").select("title,starts_at").eq("operator_id",operatorId).in("starts_at",starts):{data:[]};
 const existingKeys=new Set((existing??[]).map(row=>`${new Date(row.starts_at).toISOString()}|${normalizedTitle(row.title)}`));
 const localKeys=new Set<string>();let skippedCount=0;
 const rows=parsedRows.filter(row=>{const key=`${new Date(row.starts_at).toISOString()}|${normalizedTitle(row.title)}`;if(existingKeys.has(key)||localKeys.has(key)){skippedCount++;return false;}localKeys.add(key);return true;});
 if(rows.length===0){await service.from("event_import_batches").update({status:"parsed",parsed_count:0}).eq("id",batch.id);return NextResponse.json({ok:true,parsed_count:0,skipped_count:skippedCount,batch_id:batch.id});}
 const {error:insertError}=await service.from("events").insert(rows);if(insertError){await service.from("event_import_batches").update({status:"rejected"}).eq("id",batch.id);return NextResponse.json({error:"Il calendario è stato letto, ma non è stato possibile creare gli eventi"},{status:500});}
 await service.from("event_import_batches").update({status:"parsed",parsed_count:rows.length}).eq("id",batch.id);
 return NextResponse.json({ok:true,parsed_count:rows.length,skipped_count:skippedCount,batch_id:batch.id});
}
