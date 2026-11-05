import municipalityIndex from "@/data/municipalities-messina-2026.json";

/**
 * BIMARIS pilot classification of geographic points.
 * Municipal borders: ISTAT 2026, WGS84; published as per-municipality GeoJSON
 * by https://github.com/l1n00/confini-comuni-istat (derived from ISTAT).
 * BIMARIS macroarea mapping is editorial, NOT an official ISTAT grouping.
 * Unknown/ambiguous municipalities deliberately remain unclassified.
 */
export type TerritorySlug="messina"|"area-ionica"|"area-tirrenica";
type Municipality={name:string;code:string;bbox:number[]};

type Geometry={type:"Polygon"|"MultiPolygon";coordinates:any};
type FeatureCollection={features:Array<{geometry:Geometry}>};
const BASE="https://l1n00.github.io/confini-comuni-istat/2026";
// Validated pilot points only. The rest of the municipality-to-macroarea
// mapping requires editorial approval, particularly Nebrodi, Eolie and inland towns.
// Validated locality: Motta Camastra belongs to the Alcantara/Taormina ionian district.
// Sources: Comune di Motta Camastra, territorial data (Colline litoranee di Taormina),
// Citta Metropolitana di Messina, 2024, SP6 "arteria stradale ionica".
const IONICA=new Set(["Taormina","Motta Camastra"].map(normalize));
const TIRRENICA=new Set(["Milazzo"].map(normalize));
function normalize(s:string){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")}
function inRing(lon:number,lat:number,ring:number[][]):boolean{
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>lat)!==(b[1]>lat))&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function inPolygon(lon:number,lat:number,rings:number[][][]):boolean{
 if(!rings.length||!inRing(lon,lat,rings[0]))return false;
 for(let i=1;i<rings.length;i++)if(inRing(lon,lat,rings[i]))return false;
 return true;
}
function contains(lon:number,lat:number,g:Geometry):boolean{
 if(g.type==="Polygon")return inPolygon(lon,lat,g.coordinates);
 if(g.type==="MultiPolygon")return (g.coordinates as number[][][][]).some(p=>inPolygon(lon,lat,p));
 return false;
}
function classifyName(name:string):TerritorySlug|null{
 if(normalize(name)==="messina")return "messina";
 if(IONICA.has(normalize(name)))return "area-ionica";
 if(TIRRENICA.has(normalize(name)))return "area-tirrenica";
 return null;
}
export type TerritoryClassification={
 status:"assigned"|"review"|"outside"|"unavailable";
 municipality:string|null;municipalityCode:string|null;territorySlug:TerritorySlug|null;
 evidence:string;
};
async function loadJson<T>(url:string):Promise<T>{
 const response=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error("Geographic dataset unavailable");
 return await response.json() as T;
}
export async function classifyPoint(latitude:number,longitude:number):Promise<TerritoryClassification>{
 const evidence="ISTAT comuni 2026 (confini amministrativi); classificazione editoriale BIMARIS v1";
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){
  return {status:"unavailable",municipality:null,municipalityCode:null,territorySlug:null,evidence};
 }
 try{
  const candidates=(municipalityIndex.municipalities as Municipality[]).filter(m=>{
   const b=m.bbox;
   return m.code.startsWith("083")&&b?.length===4&&longitude>=b[0]&&longitude<=b[2]&&latitude>=b[1]&&latitude<=b[3];
  });
  let failedGeometry=false;
  const found=await Promise.all(candidates.map(async municipality=>{
   try{
    const collection=await loadJson<FeatureCollection>(BASE+"/comuni/"+municipality.code+".geojson");
    return collection.features?.some(f=>contains(longitude,latitude,f.geometry))?municipality:null;
   }catch{failedGeometry=true;return null}
  }));
  const matches=found.filter((m):m is Municipality=>m!==null);
  if(failedGeometry)return {status:"unavailable",municipality:null,municipalityCode:null,territorySlug:null,evidence};
  if(matches.length!==1)return {status:matches.length>1?"review":"outside",municipality:matches[0]?.name??null,municipalityCode:matches[0]?.code??null,territorySlug:null,evidence};
  const municipality=matches[0],territorySlug=classifyName(municipality.name);
  return {status:territorySlug?"assigned":"review",municipality:municipality.name,municipalityCode:municipality.code,territorySlug,evidence};
 }catch{
  return {status:"unavailable",municipality:null,municipalityCode:null,territorySlug:null,evidence};
 }
}
