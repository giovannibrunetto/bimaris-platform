import { redirect } from "next/navigation";
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
function isResults(value: unknown): value is Results {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string,unknown>;
  return Number.isSafeInteger(o.responses) && Number.isSafeInteger(o.launch_contacts)
    && Array.isArray(o.choices) && o.choices.length === 4
    && o.choices.every((r:unknown) => Array.isArray(r) && r.length === 4 && r.every((x:unknown)=>typeof x === "number" && Number.isSafeInteger(x) && x>=0))
    && Array.isArray(o.ideas) && o.ideas.length<=20
    && o.ideas.every((v:unknown)=>!!v && typeof v==="object" && typeof (v as Record<string,unknown>).text==="string" && typeof (v as Record<string,unknown>).date==="string");
}
export default async function QuestionariPage() {
  if (!(await isAuthorizedAdmin())) redirect("/admin/login");
  const db = createServiceClient();
  const result = db ? await db.rpc("admin_citizen_survey_summary") : null;
  const data: Results | null = result && !result.error && isResults(result.data) ? result.data : null;
  return <section className="survey-admin" aria-labelledby="survey-admin-heading">
    <div className="survey-admin__heading">
      <span className="survey-admin__eyebrow">Centro operativo / Questionari e sondaggi</span>
      <h2 id="survey-admin-heading">Questionario cittadini</h2>
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
      <div className="survey-admin__charts">
        {questions.slice(0,4).map((question,index) => {
          const values=data.choices[index] || [0,0,0,0];
          const denominator = index===3 ? values.reduce((sum,n)=>sum+n,0) : data.responses;
          return <section key={question.title} className="survey-admin__panel" aria-label={question.title}>
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
      </div>
      <section className="survey-admin__panel survey-admin__ideas">
        <h3>Risposte aperte</h3>
        <p className="survey-admin__caption">Ultime 20 risposte non vuote, senza identificativi. Trattare i testi come potenziali dati personali; non divulgarli.</p>
        {data.ideas.length===0 ? <p>Nessuna risposta aperta disponibile.</p>:
          <ul>{data.ideas.map((entry,i)=><li key={i}><span>{entry.date}</span><p>{entry.text}</p></li>)}</ul>}
      </section>
    </>}
    <p className="survey-admin__caption">L'archivio email rimane separato e non è consultabile in questa sezione. L'esportazione dei dati richiede un controllo specifico su autorizzazioni, minimizzazione e retention.</p>
  </section>;
}
