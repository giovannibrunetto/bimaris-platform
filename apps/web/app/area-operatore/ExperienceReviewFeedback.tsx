type ReviewSections={basics?:string;description?:string;details?:string;media?:string;location?:string};
type Experience={id:string;name:string;review_status:string;review_notes:string|null;review_sections:ReviewSections|null};

const sections:[keyof ReviewSections,string,string][]=[
 ["basics","Informazioni principali","Identità"],
 ["description","Descrizione","Racconto"],
 ["details","Durata, prezzo e dettagli","Dettagli"],
 ["media","Fotografie","Immagini"],
 ["location","Luogo e punto di incontro","Dettagli"]
];

export default function ExperienceReviewFeedback({experiences}:{experiences:Experience[]}){
 const rejected=experiences.filter(e=>e.review_status==="rejected");
 if(!rejected.length)return null;
 return <div style={{display:"grid",gap:14,margin:"22px 0"}}>{rejected.map(experience=>{
  const feedback=sections.filter(([key])=>Boolean(experience.review_sections?.[key]?.trim()));
  return <article key={experience.id} className="detail-panel" style={{border:"1px solid rgba(153,91,42,.28)",padding:20}}>
   <div className="eyebrow">Revisione BIMARIS · Da correggere</div>
   <h3 style={{margin:"6px 0 8px"}}>{experience.name}</h3>
   <p style={{marginTop:0}}>Abbiamo indicato con precisione le parti da aggiornare. Quando riapri l'esperienza, usa queste indicazioni come guida e inviala nuovamente in revisione.</p>
   {feedback.length>0?<div style={{display:"grid",gap:10,marginTop:16}}>{feedback.map(([key,label,step])=><div key={key} style={{padding:"14px 16px",borderRadius:14,background:"rgba(153,91,42,.08)"}}><div className="eyebrow">Passaggio · {step}</div><strong>{label}</strong><p style={{margin:"6px 0 0",whiteSpace:"pre-wrap"}}>{experience.review_sections?.[key]}</p></div>)}</div>:experience.review_notes?<div style={{marginTop:14,padding:"14px 16px",borderRadius:14,background:"rgba(153,91,42,.08)"}}><strong>Indicazioni BIMARIS</strong><p style={{margin:"6px 0 0",whiteSpace:"pre-wrap"}}>{experience.review_notes}</p></div>:null}
  </article>;
 })}</div>;
}
