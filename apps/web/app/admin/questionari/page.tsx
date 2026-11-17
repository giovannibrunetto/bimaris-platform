import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase/server";
import { questions } from "@/app/questionario-cittadini/questions";
import "./questionari.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Results = {
  responses: number;
  launch_contacts: number;
  choices: number[][];
  ideas: {date:string; text:string}[];
};
type IdeasPage = {total:number; page:number; page_size:number; items:{date:string;text:string}[]};
function isIdeasPage(v:unknown):v is IdeasPage {
  if (!v || typeof v!=="object") return false;
  const r=v as Record<string,unknown>;
  return typeof r.total==="number" && Number.isSafeInteger(r.total) && r.total>=0 && r.page_size===20 && typeof r.page==="number"
    && Array.isArray(r.items) && r.items.length<=20 && r.items.every((x:unknown)=>!!x && typeof x==="object" && typeof (x as Record<string,unknown>).date==="string" && typeof (x as Record<string,unknown>).text==="string");
}
function isResults(value: unknown): value is Results {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string,unknown>;
  return Number.isSafeInteger(o.responses) && Number.isSafeInteger(o.launch_contacts)
    && Array.isArray(o.choices) && o.choices.length === 4
    && o.choices.every((r:unknown) => Array.isArray(r) && r.length === 4 && r.every((x:unknown)=>typeof x === "number" && Number.isSafeInteger(x) && x>=0))
    && Array.isArray(o.ideas) && o.ideas.length<=20
    && o.ideas.every((v:unknown)=>!!v && typeof v==="object" && typeof (v as Record<string,unknown>).text==="string" && typeof (v as Record<string,unknown>).date==="string");
}
export default async function QuestionariPage({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}) {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const params=await searchParams;
  const rawPage=Number(params?.page ?? "1");
  const page=Number.isSafeInteger(rawPage) && rawPage>=1 && rawPage<=100000 ? rawPage : 1;
  const search=(params?.q ?? "").trim().slice(0,80);
  const db = createServiceClient();
  const [result, ideasResult] = db ? await Promise.all([
    db.rpc("admin_citizen_survey_summary"),
    db.rpc("admin_citizen_survey_ideas",{p_page:page,p_search:search}),
  ]) : [null,null];
  const data: Results | null = result && !result.error && isResults(result.data) ? result.data : null;
  const ideas: IdeasPage | null = ideasResult && !ideasResult.error && isIdeasPage(ideasResult.data) ? ideasResult.data : null;
  const pages=ideas ? Math.max(1,Math.ceil(ideas.total/20)) : 1;
  const pageUrl=(number:number)=>"/admin/questionari?"+new URLSearchParams({page:String(number),...(search?{q:search}:{})}).toString();
  return <section className="survey-admin" aria-labelledby="survey-admin-heading">
    <div className="survey-admin__heading">
      <span className="survey-admin__eyebrow">Centro operativo / Questionari e sondaggi</span>
      <div className="survey-admin__title-row"><h2 id="survey-admin-heading">Questionario cittadini</h2><Link className="survey-admin__open-questionnaire" href="/questionario-cittadini">Apri il questionario <span aria-hidden="true">↗</span></Link></div>
      <p>Risultati del questionario «A MESSINA NON C’È NENTI!». Solo risposte reali, escluse le prove di collaudo.</p>
    </div>
    {!data ? <div role="alert" className="survey-admin__notice">
      Risultati non disponibili: il modulo di consultazione deve ancora essere installato o verificato su Staging. Nessun dato viene simulato.
    </div> : <>
      <div className="survey-admin__stats" aria-label="Indicatori del questionario">
        <div><span>Questionari ricevuti</span><strong>{data.responses.toLocaleString("it-IT")}</strong></div>
        <div><span>Adesioni all’avviso di lancio</span><strong>{data.launch_contacts.toLocaleString("it-IT")}</strong></div>
      </div>
      <p className="survey-admin__caption">Le adesioni sono contatti distinti, non collegati alle risposte individuali. Nessun indirizzo email è mostrato in questa pagina.</p>
      <nav className="survey-admin__question-index" aria-label="Indice delle cinque domande"><strong>Le 5 domande del questionario</strong><div>{questions.map((q,i)=><a key={q.title} href={`#survey-question-${i+1}`}>Domanda {i+1}<span>{i===4?"Risposta aperta":"Grafico"}</span></a>)}</div></nav>
      <div className="survey-admin__charts">
        {questions.slice(0,4).map((question,index) => {
          const values=data.choices[index] || [0,0,0,0];
          const denominator = index===3 ? values.reduce((sum,n)=>sum+n,0) : data.responses;
          return <section key={question.title} id={`survey-question-${index+1}`} className="survey-admin__panel" aria-label={`Domanda ${index+1} di 5: ${question.title}`}>
            <span className="survey-admin__question-number">DOMANDA {index+1} DI 5</span>
            <h3>{question.title}</h3>
            <p className="survey-admin__caption">{index===2?"Fino a due risposte per questionario":index===3?"Percentuali sulle risposte espresse":"Percentuali sui questionari ricevuti"}</p>
            {question.options.map((option,i)=> {
              const count=values[i] || 0;
              const percent=denominator>0 ? Math.round(count*100/denominator):0;
              return <div key={option} className="survey-admin__answer">
                <div className="survey-admin__line"><span>{option}</span><strong>{count} · {percent}%</strong></div>
                <div className="survey-admin__track" role="img" aria-label={option+": "+count+" risposte, "+percent+" per cento"}><div style={{width:Math.min(percent,100)+"%"}}/></div>
              </div>;
            })}
          </section>;
        })}
      <section id="survey-question-5" className="survey-admin__panel survey-admin__ideas" aria-label={`Domanda 5 di 5: ${questions[4].title}`}>
        <span className="survey-admin__question-number">DOMANDA 5 DI 5 · RISPOSTA APERTA</span>
        <h3>{questions[4].title}</h3>
        <p className="survey-admin__caption">Tutte le risposte aperte non scadute, consultabili 20 alla volta e senza identificativi. Trattare i testi come potenziali dati personali; non divulgarli.</p>
        <form className="survey-admin__search" method="get" action="/admin/questionari"><label htmlFor="survey-answer-search">Cerca nelle risposte aperte</label><div><input id="survey-answer-search" type="search" name="q" maxLength={80} defaultValue={search} placeholder="Parola o frase" /><button type="submit">Cerca</button></div></form>
        {!ideas ? <p role="alert">Consultazione delle risposte aperte temporaneamente non disponibile.</p> : <>
          <p className="survey-admin__caption">{ideas.total.toLocaleString("it-IT")} risposte corrispondenti · pagina {page} di {pages} · 20 per pagina</p>
          {ideas.items.length===0 ? <p>Nessuna risposta aperta disponibile.</p>:
            <ul>{ideas.items.map((entry,i)=><li key={i}><span>{entry.date}</span><p>{entry.text}</p></li>)}</ul>}
          <nav aria-label="Paginazione risposte aperte" className="survey-admin__paging">{page>1 && <Link href={pageUrl(page-1)}>← Precedente</Link>}{page<pages && <Link href={pageUrl(page+1)}>Successiva →</Link>}</nav>
        </>}
      </section>
      </div>
    </>}
    <p className="survey-admin__caption">L'archivio email rimane separato e non è consultabile in questa sezione. L'esportazione dei dati richiede un controllo specifico su autorizzazioni, minimizzazione e retention.</p>
  </section>;
}
