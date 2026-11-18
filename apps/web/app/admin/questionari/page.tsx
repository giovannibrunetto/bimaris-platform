import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { questions } from "@/app/questionario-cittadini/questions";
import "./questionari.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Results = { responses:number; launch_contacts:number; choices:number[][]; latest_response_date:string|null };
type IdeasPage = { total:number; page:number; page_size:number; items:{date:string;text:string}[] };

function isResults(v:unknown):v is Results {
  if(!v || typeof v!=="object") return false;
  const x=v as Record<string,unknown>;
  return Number.isSafeInteger(x.responses) && (x.responses as number)>=0
    && Number.isSafeInteger(x.launch_contacts) && (x.launch_contacts as number)>=0
    && (x.latest_response_date===null || typeof x.latest_response_date==="string")
    && Array.isArray(x.choices) && x.choices.length>=4
    && x.choices.slice(0,4).every((row:unknown)=>Array.isArray(row) && row.length===4
      && row.every((n:unknown)=>Number.isSafeInteger(n) && (n as number)>=0));
}
function isIdeas(v:unknown):v is IdeasPage {
  if(!v || typeof v!=="object") return false;
  const x=v as Record<string,unknown>;
  return Number.isSafeInteger(x.total) && (x.total as number)>=0
    && Number.isSafeInteger(x.page) && x.page_size===20
    && Array.isArray(x.items) && x.items.length<=20
    && x.items.every((item:unknown)=>!!item && typeof item==="object"
      && typeof (item as Record<string,unknown>).date==="string"
      && typeof (item as Record<string,unknown>).text==="string");
}
/** Server-only Production connection. Never use the Staging admin identity client to read live data. */
function reportingClient() {
  const url=process.env.BIMARIS_SURVEY_REPORTING_URL;
  const key=process.env.BIMARIS_SURVEY_REPORTING_SECRET_KEY;
  if(url!=="https://vhvccwvcqdhiovpopsze.supabase.co" || !key || key.length<24) return null;
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export default async function QuestionariPage({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}) {
  // Existing server-side Super Admin gate validates the user session and AAL2.
  if(!(await isAuthorizedAdmin())) redirect("/admin/login");
  const params=await searchParams;
  const candidate=Number(params?.page ?? "1");
  const page=Number.isSafeInteger(candidate) && candidate>=1 && candidate<=100000?candidate:1;
  const search=typeof params?.q==="string"?params.q.trim().slice(0,80):"";
  const db=reportingClient();
  const [s,i]=db ? await Promise.all([
    db.rpc("admin_citizen_survey_summary"),
    db.rpc("admin_citizen_survey_ideas",{p_page:page,p_search:search}),
  ]) : [null,null];
  const data:Results|null=s && !s.error && isResults(s.data)?s.data:null;
  const ideas:IdeasPage|null=i && !i.error && isIdeas(i.data)?i.data:null;
  const pages=ideas?Math.max(1,Math.ceil(ideas.total/20)):1;
  const pageUrl=(n:number)=>"/admin/questionari?"+new URLSearchParams({page:String(n),...(search?{q:search}:{})}).toString();
  return <section className="survey-admin" aria-labelledby="survey-admin-heading">
    <div className="survey-admin__heading">
      <span className="survey-admin__eyebrow">Centro operativo / Questionari e sondaggi</span>
      <div className="survey-admin__title-row">
        <h2 id="survey-admin-heading">Questionario cittadini</h2>
        <Link className="survey-admin__open-questionnaire" href="https://sondaggio.bimarisnet.it/questionario-cittadini" target="_blank" rel="noopener noreferrer">Apri il questionario pubblico ↗</Link>
      </div>
      <p>Risultati reali del sondaggio «A MESSINA NON C’È NENTI!» in Supabase Production. La consultazione è riservata ai Super Admin con MFA verificata.</p>
    </div>
    {!db || !data ? <div className="survey-admin__notice" role="alert">
      Statistiche Production non disponibili. Il collegamento riservato al server amministrativo non è ancora configurato o non è stato verificato.
      Nessuna risposta viene simulata. Il questionario pubblico continua a funzionare separatamente.
    </div> : <>
      <section className="survey-admin__panel" aria-labelledby="survey-real-heading">
        <span className="survey-admin__question-number">PRODUCTION · DATI REALI</span>
        <h3 id="survey-real-heading">Risultati del questionario</h3>
        <div className="survey-admin__stats" aria-label="Indicatori del questionario">
          <div><span>Risposte ricevute</span><strong>{data.responses.toLocaleString("it-IT")}</strong></div>
          <div><span>Contatti per l’avviso di lancio</span><strong>{data.launch_contacts.toLocaleString("it-IT")}</strong></div>
        </div>
        <p className="survey-admin__caption">Le email sono conservate in un archivio separato e non vengono mostrate né esportate in questa sezione. Ultima data di raccolta: {data.latest_response_date??"nessuna"}.</p>
      </section>
      <nav className="survey-admin__question-index" aria-label="Indice delle cinque domande">
        <strong>Le 5 domande del questionario</strong>
        <div>{questions.map((q,index)=><a key={q.title} href={`#survey-question-${index+1}`}>Domanda {index+1}<span>{index===4?"Risposta aperta":"Grafico"}</span></a>)}</div>
      </nav>
      <div className="survey-admin__charts">
        {questions.slice(0,4).map((question,index)=>{
          const values=data.choices[index] ?? [0,0,0,0];
          const denominator=index===3?values.reduce((total,n)=>total+n,0):data.responses;
          return <section key={question.title} id={`survey-question-${index+1}`} className="survey-admin__panel">
            <span className="survey-admin__question-number">DOMANDA {index+1} DI 5</span>
            <h3>{question.title}</h3>
            <p className="survey-admin__caption">{index===2?"Massimo due scelte per risposta":index===3?"Percentuali sulle risposte espresse":"Percentuali sui questionari ricevuti"}</p>
            {question.options.map((option,n)=>{
              const count=values[n]??0;
              const percent=denominator>0?Math.round(count*100/denominator):0;
              return <div key={option} className="survey-admin__answer">
                <div className="survey-admin__line"><span>{option}</span><strong>{count} · {percent}%</strong></div>
                <div className="survey-admin__track" role="img" aria-label={option+": "+count+" risposte, "+percent+" per cento"}><div style={{width:Math.min(percent,100)+"%"}}/></div>
              </div>;
            })}
          </section>;
        })}
        <section id="survey-question-5" className="survey-admin__panel survey-admin__ideas">
          <span className="survey-admin__question-number">DOMANDA 5 DI 5 · RISPOSTA APERTA</span>
          <h3>{questions[4].title}</h3>
          <p className="survey-admin__caption">Risposte aperte non scadute: possono contenere informazioni personali inserite spontaneamente. Accesso riservato; non divulgarle.</p>
          <form className="survey-admin__search" method="get" action="/admin/questionari">
            <label htmlFor="survey-answer-search">Cerca nelle risposte aperte</label>
            <div><input id="survey-answer-search" type="search" name="q" maxLength={80} defaultValue={search} placeholder="Parola o frase"/><button type="submit">Cerca</button></div>
          </form>
          {!ideas?<p className="survey-admin__notice" role="alert">Le risposte aperte non sono temporaneamente disponibili.</p>:<>
            <p className="survey-admin__caption">{ideas.total.toLocaleString("it-IT")} risposte · pagina {page} di {pages}</p>
            {ideas.items.length===0?<p>Nessuna risposta aperta disponibile.</p>:<ul>{ideas.items.map((v,k)=><li key={k}><span>{v.date}</span><p>{v.text}</p></li>)}</ul>}
            <nav aria-label="Paginazione risposte aperte" className="survey-admin__paging">
              {page>1&&<Link href={pageUrl(page-1)}>← Precedente</Link>}
              {page<pages&&<Link href={pageUrl(page+1)}>Successiva →</Link>}
            </nav>
          </>}
        </section>
      </div>
    </>}
    <p className="survey-admin__caption">Le statistiche non consentono accesso pubblico agli archivi. Le operazioni su email, revoche ed esportazioni richiedono un flusso amministrativo separato e verificato.</p>
  </section>;
}
