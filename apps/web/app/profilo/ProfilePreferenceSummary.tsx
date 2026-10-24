import Link from "next/link";

type Props={
 travelCompanion?:string|null;
 typicalTime?:string|null;
 preferredPace?:string|null;
};

const companionLabels:Record<string,string>={solo:"Da solo",coppia:"In coppia",famiglia:"In famiglia",amici:"Con amici"};
const timeLabels:Record<string,string>={"2-3-ore":"Un paio d’ore","mezza-giornata":"Mezza giornata",giornata:"Una giornata","piu-giorni":"Più giorni"};
const paceLabels:Record<string,string>={rilassato:"Con calma",equilibrato:"Un po’ di tutto",intenso:"Più cose possibili"};

export default function ProfilePreferenceSummary({travelCompanion,typicalTime,preferredPace}:Props){
 const items=[
  {label:"Con chi",value:travelCompanion?companionLabels[travelCompanion]??travelCompanion:null},
  {label:"Tempo",value:typicalTime?timeLabels[typicalTime]??typicalTime:null},
  {label:"Ritmo",value:preferredPace?paceLabels[preferredPace]??preferredPace:null},
 ].filter(item=>item.value);
 if(!items.length)return null;
 return <div className="profile-preference-summary">
  <style>{`
   @media(min-width:851px){
    .profile-shell{max-width:1240px!important}
    .profile-overview{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,1.85fr)!important}
    .overview-head{grid-column:1;padding:25px 28px 10px!important}
    .profile-preference-summary{grid-column:1;padding:0 28px 24px!important}
    .overview-grid{grid-column:2;grid-row:1 / span 2;border-top:0!important;border-left:1px solid rgba(135,109,63,.14);grid-template-columns:1.35fr .72fr .82fr!important}
    .overview-item{padding:25px 20px!important;display:flex;flex-direction:column;justify-content:center}
    .recommendation-head{align-items:center!important}
    .recommendation-head p{max-width:430px!important}
    .recommendation-grid{gap:16px!important}
    .recommendation-card{padding:21px!important;min-height:190px;display:flex;flex-direction:column}
    .recommendation-card .text-link{margin-top:auto}
    .recommendation-more .recommendation-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;max-width:calc(66.666% - 5px)}
   }
   @media(max-width:850px){
    .profile-preference-tag{flex:1 1 calc(50% - 6px);justify-content:space-between}
    .recommendation-card{min-height:0}
   }
  `}</style>
  <div className="overview-label">Il tuo modo di vivere Messina</div>
  <div className="profile-preference-tags">{items.map(item=><span className="profile-preference-tag" key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}</div>
  <p className="profile-preference-note">BIMARIS usa anche queste indicazioni per rendere progressivamente più pertinenti i suggerimenti.</p>
  <Link className="text-link overview-action" href="/profilo/onboarding">Modifica il profilo →</Link>
 </div>;
}
