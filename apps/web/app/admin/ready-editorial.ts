import "server-only";
import type { createServiceClient } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof createServiceClient>>;
type Draft = { title?: string; body?: string; deletedAt?: unknown; placeId?: string; mapsUrl?: string; newPlace?: { mapsUrl?: string }; location?: {latitude?: number; longitude?: number}; subtitle?: string; theme?: string; intro?: unknown[]; conclusion?: unknown[]; chapters?: {title?: string;paragraphs?: unknown[]}[]; photos?: unknown[] };
type Workspace = {id:string; model:string; entry_id:string|null; version:number; archived:boolean; draft:Draft};
type Activity = {workspace_id:string;version:number;action:string};
const labels: Record<string,string> = {culture:"Cultura",legend:"Miti e leggende",village:"Borghi",historical:"Racconti di Messina"};

export function isReadyEditorial(w:Workspace, action:string|undefined, cultureMapsUrl?:string|null) {
  const d=w.draft;
  if(w.archived || !d || "deletedAt" in d || !labels[w.model] || !["save","photo"].includes(action??"") || !d.title?.trim()) return false;
  if (/^(COLLAUDO|TEST SINTETICO)(?:\s|[-—:]|$)/i.test(d.title.trim())) return false;
  if(w.model==="historical") return Boolean(d.subtitle && d.theme && d.intro?.length && d.conclusion?.length && d.chapters?.length && d.chapters.every(chapter=>chapter.title && chapter.paragraphs?.length));
  return Boolean(d.body?.trim() && (w.model!=="culture" || d.placeId || d.mapsUrl || d.newPlace?.mapsUrl || cultureMapsUrl || (d.location?.latitude!=null && d.location?.longitude!=null)));
}

export async function loadReadyEditorial(db:Db) {
  const {data,error}=await db.from("editorial_workspaces").select("id,model,entry_id,version,archived,draft").eq("archived",false).gt("version",0);
  if(error) throw new Error("Impossibile caricare le bozze editoriali");
  const workspaces=(data??[]) as Workspace[];
  if(!workspaces.length) return [];
  const revisions:Activity[]=[];
  for(let offset=0;offset<workspaces.length;offset+=25){
    const batch=workspaces.slice(offset,offset+25);
    const {data:rows,error:activityError}=await db.from("editorial_activity").select("workspace_id,version,action").in("workspace_id",batch.map(w=>w.id)).in("version",[...new Set(batch.map(w=>w.version))]);
    if(activityError) throw new Error("Impossibile caricare lo stato delle modifiche editoriali");
    revisions.push(...(rows??[]));
  }
  const activity=new Map(revisions.map(a=>[a.workspace_id+":"+a.version,a.action]));
  const cultureIds=workspaces.filter(w=>w.model==="culture"&&w.entry_id).map(w=>w.entry_id!);
  const cultureMaps=new Map<string,string|null>();
  if(cultureIds.length){
    const {data:rows,error:mapError}=await db.from("culture_entries").select("id,google_maps_url").in("id",cultureIds);
    if(mapError) throw new Error("Impossibile verificare la posizione dei monumenti");
    for(const row of rows??[]) cultureMaps.set(row.id,row.google_maps_url);
  }
  return workspaces.filter(w=>isReadyEditorial(w,activity.get(w.id+":"+w.version),w.entry_id?cultureMaps.get(w.entry_id):null)).map(w=>({
    id:w.id, title:w.draft.title!, category:labels[w.model], model:w.model,
    reason:w.entry_id?(w.draft.photos?.length?"Aggiornamento fotografico":"Modifiche salvate"):"Nuova scheda",
    href:w.model==="historical"?"/admin/archivio-editoriale/racconti?id="+w.id:"/admin/archivio-editoriale?sezione="+w.model+"&id="+w.id+"#editorial-publication"
  })).sort((a,b)=>a.category.localeCompare(b.category,"it")||a.title.localeCompare(b.title,"it"));
}
