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
  {label:"Tempo",value:typicalTime?timeLabels[typicalTime]??timeLabels[typicalTime]:null},
  {label:"Ritmo",value:preferredPace?paceLabels[preferredPace]??preferredPace:null},
 ].filter(item=>item.value);
 if(!items.length)return null;
 return <div className="profile-preference-summary">
  <style>{`
   @media(min-width:851px){
    .profile-shell{max-width:1240px!important}
    .profile-overview{display:grid!important;grid-template-columns:minmax(300px,1.02fr) minmax(0,1.98fr)!important;column-gap:42px!important;align-items:start!important}
    .overview-head{grid-column:1;padding:18px 0 8px!important}
    .profile-preference-summary{grid-column:1;padding:0 0 10px!important}
    .overview-grid{grid-column:2;grid-row:1 / span 2;border:0!important;grid-template-columns:minmax(0,1.2fr) minmax(160px,.78fr) minmax(170px,.82fr)!important;gap:28px!important;align-self:center!important}
    .overview-item{padding:18px 0!important;display:flex;flex-direction:column;justify-content:flex-start}
    .overview-item+.overview-item{border:0!important}
    .recommendation-head{align-items:end!important}
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
