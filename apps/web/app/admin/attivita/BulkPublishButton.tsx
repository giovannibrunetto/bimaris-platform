"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
type Category="experiences"|"appointments"|"editorial";
type Item={id:string;title:string;version?:number};
type Failure={title:string;reason:string};
const labels={experiences:"esperienze",appointments:"appuntamenti",editorial:"schede editoriali"};

export default function BulkPublishButton({category,items}:{category:Category;items:Item[]}){
 const router=useRouter();
 const busy=useRef(false);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const [result,setResult]=useState<{success:number;failures:Failure[]}|null>(null);
 async function publish(){
  if(busy.current||!items.length)return;
  const snapshot=items.map(item=>({...item}));
  if(!window.confirm("Pubblicare "+snapshot.length+" "+labels[category]+"? Saranno elaborate solo le schede di questo elenco. Le schede non più pronte o modificate nel frattempo saranno escluse."))return;
  busy.current=true;
  setResult(null);
  setProgress({done:0,total:snapshot.length});
  const failures:Failure[]=[];
  let success=0;
  try{
   for(let i=0;i<snapshot.length;i++){
    const item=snapshot[i];
    try{
     const response=await fetch("/api/admin/publications/bulk-item",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({category,id:item.id,version:item.version}),redirect:"error"});
     const data=await response.json().catch(()=>null);
     if(response.ok&&data?.ok===true)success++;
     else failures.push({title:item.title,reason:response.status===403?"Sessione o autorizzazione non valida.":data?.reason||"Pubblicazione non confermata; controlla lo stato prima di riprovare."});
     if(response.status===403){
      for(const remaining of snapshot.slice(i+1))failures.push({title:remaining.title,reason:"Non elaborata: sessione o autorizzazione non valida."});
      break;
     }
    }catch{
     failures.push({title:item.title,reason:"Esito non confermato per errore di connessione. Controlla lo stato prima di riprovare."});
     for(const remaining of snapshot.slice(i+1))failures.push({title:remaining.title,reason:"Non elaborata: connessione interrotta."});
     break;
    }
    setProgress({done:i+1,total:snapshot.length});
   }
  }finally{
   setResult({success,failures});
   setProgress(null);
   busy.current=false;
   router.refresh();
  }
 }
 return <div className="admin-events__bulk">
  <button type="button" className="admin-events__examine" disabled={!!progress||!items.length} onClick={publish}>{progress?"Pubblicazione "+progress.done+"/"+progress.total+"…":category==="appointments"?"Pubblica tutti":"Pubblica tutte"}</button>
  {result&&<div className="admin-events__bulk-result" role="status"><strong>{result.success} pubblicati · {result.failures.length} non confermati</strong>{result.failures.length>0&&<ul>{result.failures.map((failure,i)=><li key={i}>{failure.title}: {failure.reason}</li>)}</ul>}</div>}
 </div>
}
