type ReviewNotification={to:string;experienceName:string;operatorName:string;decision:"approved"|"changes-requested";reviewNotes?:string|null};

const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL||process.env.PUBLIC_SITE_URL||"https://www.bimarisnet.it";
const FROM=process.env.BIMARIS_EMAIL_FROM||"BIMARIS <no-reply@auth.bimarisnet.it>";

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]||char));}

export async function sendReviewNotification(input:ReviewNotification){
 const apiKey=process.env.RESEND_API_KEY;
 if(!apiKey){console.warn("BIMARIS review notification skipped: RESEND_API_KEY missing");return {sent:false,reason:"not-configured" as const};}
 const approved=input.decision==="approved";
 const subject=approved?`Esperienza approvata: ${input.experienceName}`:`Modifiche richieste: ${input.experienceName}`;
 const title=approved?"La tua esperienza è online":"La tua esperienza richiede alcune modifiche";
 const intro=approved?`L'esperienza “${input.experienceName}” è stata approvata da BIMARIS ed è stata pubblicata.`:`Abbiamo completato la revisione dell'esperienza “${input.experienceName}”. Prima della pubblicazione sono necessarie alcune modifiche.`;
 const notes=!approved&&input.reviewNotes?`<div style="margin:24px 0;padding:18px;border-radius:14px;background:#f5f1e8"><strong>Indicazioni della revisione</strong><p style="white-space:pre-wrap;margin:10px 0 0">${escapeHtml(input.reviewNotes)}</p></div>`:"";
 const html=`<!doctype html><html><body style="margin:0;background:#f7f5ef;color:#1f2522;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:40px 22px"><div style="font-size:13px;letter-spacing:.18em;font-weight:700">BIMARIS · MESSINA DA VIVERE</div><h1 style="font-size:30px;line-height:1.15;margin:24px 0 16px">${title}</h1><p>Ciao ${escapeHtml(input.operatorName)},</p><p style="line-height:1.65">${escapeHtml(intro)}</p>${notes}<p style="margin:28px 0"><a href="${SITE_URL}/area-operatore" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#1f2522;color:white;text-decoration:none;font-weight:700">${approved?"Apri la tua area BIMARIS":"Apri e correggi l'esperienza"}</a></p><p style="font-size:13px;color:#68706b;line-height:1.5">Questa comunicazione è stata inviata automaticamente in seguito alla revisione della tua esperienza.</p></div></body></html>`;
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:FROM,to:[input.to],subject,html})});
 if(!response.ok){const detail=await response.text();console.error("BIMARIS review notification failed",response.status,detail.slice(0,500));return {sent:false,reason:"provider-error" as const};}
 return {sent:true as const};
}
