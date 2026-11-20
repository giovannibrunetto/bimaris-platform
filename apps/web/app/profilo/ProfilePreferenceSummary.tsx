type Props={travelCompanion?:string|null;typicalTime?:string|null;preferredPace?:string|null};
const companionLabels:Record<string,string>={solo:"Da solo",coppia:"In coppia",famiglia:"In famiglia",amici:"Con amici"};
const timeLabels:Record<string,string>={"2-3-ore":"Un paio d’ore","mezza-giornata":"Mezza giornata",giornata:"Una giornata","piu-giorni":"Più giorni"};
const paceLabels:Record<string,string>={rilassato:"Con calma",equilibrato:"Un po’ di tutto",intenso:"Più cose possibili"};
export default function ProfilePreferenceSummary({travelCompanion,typicalTime,preferredPace}:Props){
 const items=[{label:"Con chi",value:travelCompanion?companionLabels[travelCompanion]??travelCompanion:null},{label:"Tempo",value:typicalTime?timeLabels[typicalTime]??typicalTime:null},{label:"Ritmo",value:preferredPace?paceLabels[preferredPace]??preferredPace:null}].filter(item=>item.value);
 if(!items.length)return null;
 return <div className="profile-preference-summary"><h3 className="profile-preference-section-title">Come preferisci vivere Messina</h3><dl className="profile-preference-details">{items.map(item=><div className="profile-preference-detail" key={item.label}><dt>{item.label==="Tempo"?"Quanto tempo":item.label}</dt><dd>{item.value}</dd></div>)}</dl></div>;
}
