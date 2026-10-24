import { createPublicClient } from "@/lib/supabase/public";

export const DISCOVERY_INTENTS = ["culture","food-wine","nature","sea","adventure","relax","stories-places"] as const;
export const DISCOVERY_AUDIENCES = ["solo", "couple", "friends", "family"] as const;
export const DISCOVERY_SPENDING = ["up-to-25","25-50","50-100","over-100","any"] as const;
export type DiscoveryIntent = (typeof DISCOVERY_INTENTS)[number];
export type DiscoveryAudience = (typeof DISCOVERY_AUDIENCES)[number];
export type DiscoverySpending = (typeof DISCOVERY_SPENDING)[number];
export type WeatherConstraint = "rain"|"strong_wind"|"extreme_heat"|"rough_sea";
export type WeatherSnapshot={condition?:"sunny"|"partly-cloudy"|"cloudy"|"rain"|"storm"|"windy";temperatureC?:number;rain?:boolean;strongWind?:boolean;extremeHeat?:boolean;roughSea?:boolean;provider?:string;observedAt?:Date};
export type WeatherDisplay={condition:"sunny"|"partly-cloudy"|"cloudy"|"rain"|"storm"|"windy";temperatureC:number|null;label:string};

export type DiscoveryQuery = { intents: DiscoveryIntent[]; audience: DiscoveryAudience; spending?:DiscoverySpending; at?: Date; availableMinutes?: number; limit?: number; weather?:WeatherSnapshot };
export type DiscoveryResult = { id:string;slug:string;name:string;excerpt:string|null;durationMinutes:number|null;priceFrom:number|null;imageUrl:string|null;environment:string;bookingRequirement:string;bookingNoticeHours:number;score:number;availability:"now"|"today";weatherFit:"neutral"|"good"|"caution";weather:WeatherDisplay|null };
type ExperienceRow={id:string;slug:string;name:string;excerpt:string|null;duration_minutes:number|null;price_from:number|string|null;image_url:string|null;published:boolean;review_status:string};
type ProfileRow={experience_id:string;audiences:string[];environment:string;booking_requirement:string;booking_notice_hours:number;booking_cutoff_day_offset:number;booking_cutoff_time:string|null;weather_dependency:"none"|"partial"|"required";weather_constraints:string[];discovery_active:boolean;editorial_weight:number};
type IntentRow={experience_id:string;intent_key:string;weight:number|string};
type AvailabilityRow={experience_id:string;day_of_week:number;start_time:string;end_time:string;valid_from:string|null;valid_until:string|null;active:boolean};

function isoDay(date:Date){const day=date.getDay();return day===0?7:day}
function localTime(date:Date){return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}:00`}
function localDate(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function spendingScore(price:number|null,spending?:DiscoverySpending){if(!spending||spending==="any"||price==null)return spending==="any"?10:5;if(spending==="up-to-25")return price<=25?10:Math.max(0,10-(price-25)*.5);if(spending==="25-50")return price>=25&&price<=50?10:price<25?8:Math.max(0,10-(price-50)*.35);if(spending==="50-100")return price>=50&&price<=100?10:price<50?7:Math.max(0,10-(price-100)*.2);return price>=100?10:7}
function durationFitScore(duration:number|null,available?:number){if(!available||!duration)return 6;if(duration>available)return 0;const ratio=duration/available;if(ratio>=.55)return 10;if(ratio>=.3)return 8;if(ratio>=.15)return 6;return 4}
function weatherSignal(snapshot:WeatherSnapshot|undefined,key:string){if(!snapshot)return false;if(key==="rain")return Boolean(snapshot.rain);if(key==="strong_wind")return Boolean(snapshot.strongWind);if(key==="extreme_heat")return Boolean(snapshot.extremeHeat);if(key==="rough_sea")return Boolean(snapshot.roughSea);return false}
function weatherCompatibility(profile:ProfileRow,snapshot?:WeatherSnapshot){if(profile.weather_dependency==="none"||!snapshot)return {fit:"neutral" as const,score:0};const conflicts=(profile.weather_constraints??[]).filter(key=>weatherSignal(snapshot,key));if(!conflicts.length)return {fit:"good" as const,score:4};return {fit:"caution" as const,score:profile.weather_dependency==="required"?-6:-3}}
function weatherDisplay(snapshot?:WeatherSnapshot):WeatherDisplay|null{if(!snapshot)return null;let condition=snapshot.condition;if(!condition){if(snapshot.strongWind)condition="windy";else if(snapshot.rain)condition="rain";else condition="partly-cloudy"}const labels:Record<WeatherDisplay["condition"],string>={sunny:"Sereno","partly-cloudy":"Poco nuvoloso",cloudy:"Nuvoloso",rain:"Possibili piogge",storm:"Temporali",windy:"Ventoso"};return {condition,temperatureC:Number.isFinite(snapshot.temperatureC)?Math.round(snapshot.temperatureC!):null,label:labels[condition]}}
function bookingStillPossible(profile:ProfileRow,target:Date,now:Date){if(profile.booking_requirement==="none")return true;const days=Math.max(0,profile.booking_cutoff_day_offset??Math.ceil((profile.booking_notice_hours??0)/24));if(days===0)return now.getTime()<=target.getTime();const cutoff=new Date(target);cutoff.setDate(cutoff.getDate()-days);const [h,m]=String(profile.booking_cutoff_time??"23:59").split(":").map(Number);cutoff.setHours(Number.isFinite(h)?h:23,Number.isFinite(m)?m:59,0,0);return now.getTime()<=cutoff.getTime()}

export async function discoverExperiences(query:DiscoveryQuery):Promise<DiscoveryResult[]>{
 const supabase=createPublicClient();if(!supabase||!query.intents.length)return[];
 const now=new Date(),at=query.at??now,day=isoDay(at),time=localTime(at),date=localDate(at),limit=Math.max(1,Math.min(query.limit??3,5));
 const [{data:experiences},{data:profiles},{data:intents},{data:availability}]=await Promise.all([
  supabase.from("experiences").select("id,slug,name,excerpt,duration_minutes,price_from,image_url,published,review_status").eq("published",true).eq("review_status","approved"),
  supabase.from("experience_discovery_profiles").select("experience_id,audiences,environment,booking_requirement,booking_notice_hours,booking_cutoff_day_offset,booking_cutoff_time,weather_dependency,weather_constraints,discovery_active,editorial_weight").eq("discovery_active",true),
  supabase.from("experience_discovery_intents").select("experience_id,intent_key,weight").in("intent_key",query.intents),
  supabase.from("experience_availability").select("experience_id,day_of_week,start_time,end_time,valid_from,valid_until,active").eq("day_of_week",day).eq("active",true),
 ]);
 const profileMap=new Map((profiles as ProfileRow[]|null??[]).map(row=>[row.experience_id,row]));const intentMap=new Map<string,number[]>();for(const row of (intents as IntentRow[]|null??[])){const weights=intentMap.get(row.experience_id)??[];weights.push(Number(row.weight));intentMap.set(row.experience_id,weights)}const availabilityMap=new Map<string,AvailabilityRow[]>();for(const row of (availability as AvailabilityRow[]|null??[])){const rows=availabilityMap.get(row.experience_id)??[];rows.push(row);availabilityMap.set(row.experience_id,rows)}
 const results:DiscoveryResult[]=[];
 for(const experience of (experiences as ExperienceRow[]|null??[])){
  const profile=profileMap.get(experience.id),weights=(intentMap.get(experience.id)??[]).sort((a,b)=>b-a);if(!profile||!weights.length||!profile.audiences.includes(query.audience))continue;if(query.availableMinutes&&experience.duration_minutes&&experience.duration_minutes>query.availableMinutes)continue;
  const windows=(availabilityMap.get(experience.id)??[]).filter(slot=>(!slot.valid_from||slot.valid_from<=date)&&(!slot.valid_until||slot.valid_until>=date));if(!windows.length)continue;const current=windows.find(slot=>slot.start_time<=time&&slot.end_time>=time),later=windows.find(slot=>slot.start_time>time);if(!current&&!later)continue;
  const targetSlot=current??later!;const [slotH,slotM]=targetSlot.start_time.split(":").map(Number);const targetStart=new Date(at);targetStart.setHours(slotH,slotM,0,0);if(!bookingStillPossible(profile,targetStart,now))continue;
  const weather=weatherCompatibility(profile,query.weather);const best=Math.max(0,Math.min(weights[0]??0,1)),extras=weights.slice(1).reduce((sum,w)=>sum+Math.max(0,Math.min(w,1)),0);const intentScore=30*best+14*extras,audienceScore=18,durationScore=durationFitScore(experience.duration_minutes,query.availableMinutes),editorialScore=Math.max(0,Math.min(profile.editorial_weight,5));const price=experience.price_from==null?null:Number(experience.price_from),priceScore=spendingScore(price,query.spending);const availabilityScore=current?4:0;const score=Math.round((intentScore+audienceScore+durationScore+priceScore+availabilityScore+editorialScore+weather.score)*100)/100;
  results.push({id:experience.id,slug:experience.slug,name:experience.name,excerpt:experience.excerpt,durationMinutes:experience.duration_minutes,priceFrom:price,imageUrl:experience.image_url,environment:profile.environment,bookingRequirement:profile.booking_requirement,bookingNoticeHours:profile.booking_notice_hours,score,availability:current?"now":"today",weatherFit:weather.fit,weather:weatherDisplay(query.weather)});
 }
 return results.sort((a,b)=>b.score-a.score||Number(b.availability==="now")-Number(a.availability==="now")||(a.durationMinutes??Infinity)-(b.durationMinutes??Infinity)).slice(0,limit);
}
