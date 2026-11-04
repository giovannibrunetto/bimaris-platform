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
 .collection-page{background:#f5f0e6;min-height:100vh;padding:26px 20px 64px}.collection-shell{max-width:1120px;margin:auto}.collection-hero{background:linear-gradient(135deg,#0c3448,#061624 70%);color:#fff;border-radius:26px;padding:38px 42px}.collection-hero .kicker{color:#d6b879}.collection-hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(40px,5vw,58px);line-height:1;margin:8px 0 13px}.collection-hero p{color:#dfe7eb;max-width:680px;line-height:1.55;margin:0}.collection-nav{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}.collection-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 16px;border-radius:999px;font-weight:800;text-decoration:none}.collection-nav .back-profile{background:#d6b879;color:#092739}.collection-nav .explore{border:1px solid rgba(214,184,121,.62);color:#f1d79e}.collection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.saved-card{background:#fff;border:1px solid rgba(135,109,63,.18);border-radius:20px;padding:21px;display:flex;flex-direction:column;min-height:230px}.saved-kind{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:#9b6a29}.saved-card h2{font-family:Georgia,serif;font-size:27px;font-weight:400;line-height:1.08;margin:9px 0}.saved-card p{font-size:14px;line-height:1.5;color:#6f665d;flex:1}.saved-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}.saved-actions a{font-weight:750;color:#9b6223}.remove-button{border:0;background:transparent;color:#7a3834;font:inherit;font-size:13px;font-weight:750;cursor:pointer;padding:7px 0}.empty{margin-top:18px;background:#fff;border:1px solid rgba(135,109,63,.16);border-radius:20px;padding:28px}.empty h2{font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0 0 8px}.empty p{margin:0 0 15px;line-height:1.5;color:#6f665d}
 @media(max-width:850px){.collection-page{padding:12px 11px 44px}.collection-hero{border-radius:19px;padding:24px 19px}.collection-hero h1{font-size:38px}.collection-hero p{font-size:14px}.collection-nav{margin-top:19px}.collection-nav a{min-height:40px;padding:9px 14px;font-size:14px}.collection-grid{grid-template-columns:1fr;gap:11px;margin-top:13px}.saved-card{min-height:0;padding:18px}.saved-card h2{font-size:27px}.empty{margin-top:13px;padding:20px}}

 /* COLLECTION-UX-01 — coherent personal-profile visual structure */
 .collection-page{background:radial-gradient(circle at 8% 0%,rgba(34,91,94,.28),transparent 38%),linear-gradient(135deg,#071b1f 0%,#0a292d 50%,#081d20 100%);color:#f7f2e9;padding:28px 20px 70px}
 .collection-shell{max-width:1240px}
 .collection-hero{background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.018));border:1px solid rgba(216,169,79,.24);box-shadow:0 14px 44px rgba(0,0,0,.15);border-radius:25px;padding:clamp(30px,4vw,52px)}
 .collection-hero .kicker,.collection-workspace .saved-kind{color:#d8a94f}
 .collection-hero h1{color:#f7f2e9}
 .collection-hero p{color:rgba(247,242,233,.76)}
 .collection-nav .back-profile{background:#CAA86A;color:#032126}
 .collection-nav .explore{color:#EBD2A2;border-color:rgba(202,168,106,.5)}
 .collection-nav a:focus-visible,.saved-actions a:focus-visible,.remove-button:focus-visible{outline:2px solid #CAA86A;outline-offset:4px}
 .collection-workspace{margin-top:20px;padding:32px clamp(24px,3vw,42px) 38px;border:1px solid rgba(216,169,79,.19);border-radius:25px;background:rgba(255,255,255,.052)}
 .collection-workspace__head{display:flex;justify-content:space-between;align-items:end;gap:18px;flex-wrap:wrap;padding-bottom:20px;border-bottom:1px solid rgba(216,169,79,.2)}
 .collection-workspace__head h2{font-family:Georgia,serif;font-size:clamp(27px,3vw,38px);line-height:1.1;font-weight:400;color:#f7f2e9;margin:7px 0 0}
 .collection-count{display:inline-block;border:1px solid rgba(216,169,79,.3);border-radius:999px;padding:8px 12px;color:#e8d5b4;font-size:13px;font-weight:700}
 .collection-grid{margin-top:20px;gap:16px}
 .saved-card{min-height:225px;background:rgba(3,33,38,.55);border-color:rgba(216,169,79,.2);color:#f7f2e9;box-shadow:0 12px 35px rgba(0,0,0,.09);transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease,background-color .2s ease}
 .saved-card h2{color:#f7f2e9}
 .saved-card p{color:rgba(247,242,233,.76)}
 .saved-actions{padding-top:14px;border-top:1px solid rgba(216,169,79,.2)}
 .saved-actions a{color:#E4B85D}
 .remove-button{color:#F0B9AD}
 .remove-button:hover{text-decoration:underline}
 .empty{background:rgba(3,33,38,.45);border-color:rgba(216,169,79,.2);color:#f7f2e9}
 .empty h2{color:#f7f2e9}
 .empty p{color:rgba(247,242,233,.72)}
 .empty .text-link{color:#E4B85D}
 @media(hover:hover) and (pointer:fine){.saved-card:hover{border-color:#CAA86A;box-shadow:0 16px 38px rgba(0,0,0,.23),0 0 0 2px rgba(202,168,106,.32);transform:translateY(-3px) scale(1.012);background:rgba(14,55,57,.77)}}
 .saved-card:focus-within{border-color:#CAA86A;box-shadow:0 0 0 2px rgba(202,168,106,.32)}
 @media(max-width:850px){.collection-page{padding:12px 11px 45px}.collection-hero{padding:27px 19px;border-radius:20px}.collection-workspace{padding:25px 20px 28px;margin-top:14px;border-radius:20px}.collection-grid{gap:12px;margin-top:17px}.saved-card{min-height:0}.collection-workspace__head{align-items:flex-start}}
 @media(max-width:480px){.collection-workspace{padding-left:16px;padding-right:16px}.collection-workspace__head h2{font-size:29px}}
 @media(prefers-reduced-motion:reduce){.saved-card{transition:none;transform:none!important}}
  `}</style><div className="collection-shell"><section className="collection-hero"><div className="kicker">Il tuo BIMARIS</div><h1>La tua raccolta</h1><p>Luoghi, storie, sapori ed esperienze che hai scelto di conservare. Ritrovali qui senza doverli cercare di nuovo.</p><div className="collection-nav"><Link className="back-profile" href="/profilo">← Torna al profilo</Link><Link className="explore" href="/mappa">Esplora BIMARIS →</Link></div></section>
 <section className="collection-workspace"><div className="collection-workspace__head"><div><div className="saved-kind">I tuoi contenuti</div><h2>Da ritrovare, quando vuoi.</h2></div><span className="collection-count">{cards.length} {cards.length===1?"contenuto salvato":"contenuti salvati"}</span></div>
 {cards.length?<section className="collection-grid">{cards.map(card=><article className="saved-card" key={`${card.itemType}:${card.itemId}`}><div className="saved-kind">{card.kind}</div><h2>{card.title}</h2><p>{card.copy}</p><div className="saved-actions"><Link href={card.href}>Apri →</Link><form action="/profilo/raccolta/rimuovi" method="post"><input type="hidden" name="item_type" value={card.itemType}/><input type="hidden" name="item_id" value={card.itemId}/><button className="remove-button" type="submit">Rimuovi</button></form></div></article>)}</section>:<section className="empty"><h2>La raccolta è ancora vuota.</h2><p>Quando salverai un contenuto BIMARIS, lo ritroverai qui.</p><Link className="text-link" href="/mappa">Inizia a esplorare →</Link></section>}</section>
 </div></main>;
}
