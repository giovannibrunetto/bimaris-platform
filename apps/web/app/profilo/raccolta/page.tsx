import Link from "next/link";
import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedStories } from "@/data/stories";
import { getPublishedVillages } from "@/data/villages";
import { getPublishedFoodProducts } from "@/data/food-products";

export const dynamic = "force-dynamic";

type SavedRow={item_type:string;item_id:string;created_at:string};
type SavedCard={itemType:string;itemId:string;title:string;copy:string;kind:string;href:string;createdAt:string};

export default async function RaccoltaPage(){
 const supabase=await createUserServerClient();
 if(!supabase)redirect("/accedi");
 const{data:claimsData}=await supabase.auth.getClaims();
 const userId=typeof claimsData?.claims?.sub==="string"?claimsData.claims.sub:null;
 if(!userId)redirect("/accedi");
 const[{data:saved},culture,stories,villages,products,experiences]=await Promise.all([
  supabase.from("user_saved_items").select("item_type,item_id,created_at").eq("user_id",userId).order("created_at",{ascending:false}),
  getPublishedCultureEntries(),getPublishedStories(),getPublishedVillages(),getPublishedFoodProducts(),getPublishedExperiences()
 ]);
 const rows=(saved??[]) as SavedRow[];
 const cards:SavedCard[]=rows.map(row=>{
  const id=String(row.item_id);
  if(["culture","cultura"].includes(row.item_type)){const x=culture.find(v=>String(v.id)===id||v.slug===id);if(x)return{itemType:row.item_type,itemId:id,title:x.title,copy:x.excerpt,kind:"Cultura",href:`/cultura/${x.slug}`,createdAt:row.created_at};}
  if(["story","storia","mito"].includes(row.item_type)){const x=stories.find(v=>String(v.id)===id||v.slug===id);if(x)return{itemType:row.item_type,itemId:id,title:x.title,copy:x.excerpt,kind:"Miti e leggende",href:`/storie-miti-leggende/${x.slug}`,createdAt:row.created_at};}
  if(["village","borgo"].includes(row.item_type)){const x=villages.find(v=>String(v.id)===id||v.slug===id);if(x)return{itemType:row.item_type,itemId:id,title:x.name,copy:x.excerpt,kind:"Borghi",href:`/borghi/${x.slug}`,createdAt:row.created_at};}
  if(["product","prodotto","food_product"].includes(row.item_type)){const x=products.find(v=>String(v.id)===id||v.slug===id);if(x)return{itemType:row.item_type,itemId:id,title:x.name,copy:x.excerpt,kind:"Sapori e territori",href:`/sapori-territori/${x.slug}`,createdAt:row.created_at};}
  if(["experience","esperienza"].includes(row.item_type)){const x=experiences.find(v=>String(v.id)===id||v.slug===id);if(x)return{itemType:row.item_type,itemId:id,title:x.name,copy:x.excerpt,kind:x.categoryName,href:`/esperienze/${x.slug}`,createdAt:row.created_at};}
  return{itemType:row.item_type,itemId:id,title:"Contenuto salvato",copy:"Questo contenuto non è al momento disponibile nella vetrina pubblica.",kind:"BIMARIS",href:"/profilo",createdAt:row.created_at};
 });
 return <main className="collection-page"><style>{`
 .collection-page{background:#f5f0e6;min-height:100vh;padding:26px 20px 64px}.collection-shell{max-width:1120px;margin:auto}.collection-hero{background:linear-gradient(135deg,#0c3448,#061624 70%);color:#fff;border-radius:26px;padding:38px 42px}.collection-hero .kicker{color:#d6b879}.collection-hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(40px,5vw,58px);line-height:1;margin:8px 0 13px}.collection-hero p{color:#dfe7eb;max-width:680px;line-height:1.55;margin:0}.collection-nav{display:flex;gap:18px;margin-top:18px;flex-wrap:wrap}.collection-nav a{color:#d6b879;font-weight:750}.collection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.saved-card{background:#fff;border:1px solid rgba(135,109,63,.18);border-radius:20px;padding:21px;display:flex;flex-direction:column;min-height:230px}.saved-kind{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:#9b6a29}.saved-card h2{font-family:Georgia,serif;font-size:27px;font-weight:400;line-height:1.08;margin:9px 0}.saved-card p{font-size:14px;line-height:1.5;color:#6f665d;flex:1}.saved-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}.saved-actions a{font-weight:750;color:#9b6223}.remove-button{border:0;background:transparent;color:#7a3834;font:inherit;font-size:13px;font-weight:750;cursor:pointer;padding:7px 0}.empty{margin-top:18px;background:#fff;border:1px solid rgba(135,109,63,.16);border-radius:20px;padding:28px}.empty h2{font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0 0 8px}.empty p{margin:0 0 15px;line-height:1.5;color:#6f665d}
 @media(max-width:850px){.collection-page{padding:12px 11px 44px}.collection-hero{border-radius:19px;padding:24px 19px}.collection-hero h1{font-size:38px}.collection-hero p{font-size:14px}.collection-grid{grid-template-columns:1fr;gap:11px;margin-top:13px}.saved-card{min-height:0;padding:18px}.saved-card h2{font-size:27px}.empty{margin-top:13px;padding:20px}}
 `}</style><div className="collection-shell"><section className="collection-hero"><div className="kicker">Il tuo BIMARIS</div><h1>La tua raccolta</h1><p>Luoghi, storie, sapori ed esperienze che hai scelto di conservare. Ritrovali qui senza doverli cercare di nuovo.</p><div className="collection-nav"><Link href="/profilo">← Torna al profilo</Link><Link href="/mappa">Esplora BIMARIS →</Link></div></section>
 {cards.length?<section className="collection-grid">{cards.map(card=><article className="saved-card" key={`${card.itemType}:${card.itemId}`}><div className="saved-kind">{card.kind}</div><h2>{card.title}</h2><p>{card.copy}</p><div className="saved-actions"><Link href={card.href}>Apri →</Link><form action="/profilo/raccolta/rimuovi" method="post"><input type="hidden" name="item_type" value={card.itemType}/><input type="hidden" name="item_id" value={card.itemId}/><button className="remove-button" type="submit">Rimuovi</button></form></div></article>)}</section>:<section className="empty"><h2>La raccolta è ancora vuota.</h2><p>Quando salverai un contenuto BIMARIS, lo ritroverai qui.</p><Link className="text-link" href="/mappa">Inizia a esplorare →</Link></section>}
 </div></main>;
}
