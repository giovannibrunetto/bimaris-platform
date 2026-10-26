import Link from "next/link";

const pillars = [
  {
    number: "01",
    title: "Scoprire il territorio",
    copy: "BIMARIS raccoglierà luoghi, cultura, storie, sapori ed esperienze per aiutarti a conoscere Messina e il suo territorio in modo più semplice e autentico.",
  },
  {
    number: "02",
    title: "Scegliere cosa vivere",
    copy: "Percorsi, mappe e proposte locali saranno riuniti in un unico spazio per trasformare una curiosità in qualcosa da vedere, fare o vivere davvero.",
  },
  {
    number: "03",
    title: "Incontrare realtà locali",
    copy: "Operatori, produttori e professionisti selezionati potranno entrare nel racconto di BIMARIS e creare nuove connessioni con persone e altre realtà del territorio.",
  },
];

export function PrelaunchHome() {
  return (
    <>
      <section style={{minHeight:"72vh",display:"grid",placeItems:"center",padding:"88px 20px",background:"#032126",color:"#fff",textAlign:"center"}}>
        <div style={{maxWidth:940}}>
          <div style={{color:"#CAA86A",fontSize:13,fontWeight:800,letterSpacing:".16em",textTransform:"uppercase",marginBottom:18}}>Messina da vivere</div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(48px,8vw,88px)",lineHeight:1.02,margin:"0 0 26px",color:"#fff"}}>BIMARIS sta arrivando.</h1>
          <p style={{maxWidth:780,margin:"0 auto",fontSize:"clamp(18px,2.2vw,22px)",lineHeight:1.7,color:"#f4efe5"}}>Una nuova piattaforma per scoprire Messina e il suo territorio, trovare ciò che vale la pena vivere e incontrare le realtà locali che lo rendono unico.</p>
        </div>
      </section>

      <section style={{padding:"clamp(72px,10vw,118px) 20px",background:"#F7F3EB"}}>
        <div style={{maxWidth:1060,margin:"0 auto"}}>
          <div style={{maxWidth:780,margin:"0 auto clamp(48px,7vw,76px)",textAlign:"center"}}>
            <div style={{color:"#9A7942",fontSize:13,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase"}}>Cos'è BIMARIS</div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(36px,5vw,58px)",lineHeight:1.08,color:"#032126",margin:"14px 0 22px"}}>Un punto d'incontro tra persone e territorio.</h2>
            <p style={{fontSize:18,lineHeight:1.75,color:"#394850",margin:0}}>BIMARIS nasce per mettere in relazione chi vive o scopre Messina con luoghi, storie, esperienze e attività locali. Non un semplice elenco di cose da vedere, ma uno strumento per capire cosa fare e costruire il proprio modo di vivere il territorio.</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:22}}>
            {pillars.map((pillar) => (
              <article key={pillar.number} style={{borderTop:"1px solid #CAA86A",padding:"26px 8px 12px"}}>
                <div style={{color:"#9A7942",fontSize:12,fontWeight:800,letterSpacing:".14em",marginBottom:18}}>{pillar.number}</div>
                <h3 style={{fontFamily:"Georgia,serif",fontSize:28,lineHeight:1.15,color:"#032126",margin:"0 0 14px"}}>{pillar.title}</h3>
                <p style={{fontSize:16,lineHeight:1.7,color:"#4B585D",margin:0}}>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:"clamp(72px,10vw,118px) 20px",background:"#102E31",color:"#F7F3EB",textAlign:"center"}}>
        <div style={{maxWidth:850,margin:"0 auto"}}>
          <div style={{color:"#CAA86A",fontSize:13,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase"}}>Il valore per il territorio</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(36px,5vw,56px)",lineHeight:1.1,color:"#F7F3EB",margin:"14px 0 22px"}}>Più scoperta. Più connessioni. Più territorio.</h2>
          <p style={{fontSize:18,lineHeight:1.75,color:"#E9E2D5",margin:0}}>BIMARIS vuole rendere più facile scoprire ciò che Messina offre e, allo stesso tempo, dare spazio alle realtà che producono valore locale. Per chi cerca qualcosa da vivere e per chi quel territorio lo costruisce ogni giorno.</p>
        </div>
      </section>

      <section style={{padding:"clamp(76px,10vw,124px) 20px",background:"#F7F3EB",textAlign:"center"}}>
        <div style={{maxWidth:880,margin:"0 auto"}}>
          <div style={{color:"#9A7942",fontSize:13,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase"}}>Sei un operatore del territorio?</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(38px,5vw,58px)",lineHeight:1.08,color:"#032126",margin:"14px 0 22px"}}>Entra nel mondo BIMARIS fin dall'inizio.</h2>
          <p style={{fontSize:18,lineHeight:1.75,color:"#394850",margin:"0 auto 16px",maxWidth:760}}>BIMARIS sta selezionando operatori, produttori ed esperienze del territorio interessati a farsi scoprire dagli utenti e a creare nuove opportunità di collaborazione con altre realtà locali.</p>
          <p style={{fontSize:15,lineHeight:1.6,color:"#647075",margin:"0 auto 30px",maxWidth:720}}>BIMARIS è in fase di pre-lancio. La manifestazione d'interesse è gratuita e non comporta alcun impegno.</p>
          <Link className="button" href="/operatori/interesse">MANIFESTA IL TUO INTERESSE</Link>
        </div>
      </section>
    </>
  );
}
