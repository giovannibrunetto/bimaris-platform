import Link from "next/link";

export function PrelaunchHome() {
  return (
    <>
      <section style={{minHeight:"72vh",display:"grid",placeItems:"center",padding:"80px 20px",background:"#032126",color:"#fff",textAlign:"center"}}>
        <div style={{maxWidth:920}}>
          <div style={{color:"#CAA86A",fontSize:13,fontWeight:800,letterSpacing:".16em",textTransform:"uppercase",marginBottom:18}}>Messina da vivere</div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(48px,8vw,88px)",lineHeight:1.02,margin:"0 0 26px",color:"#fff"}}>BIMARIS sta arrivando.</h1>
          <p style={{maxWidth:760,margin:"0 auto",fontSize:"clamp(18px,2.2vw,22px)",lineHeight:1.7,color:"#f4efe5"}}>Un nuovo modo di scoprire Messina e il suo territorio, attraverso luoghi, storie, esperienze e realtà locali selezionate.</p>
        </div>
      </section>
      <section style={{padding:"clamp(70px,10vw,120px) 20px",background:"#F7F3EB",textAlign:"center"}}>
        <div style={{maxWidth:850,margin:"0 auto"}}>
          <div style={{color:"#CAA86A",fontSize:13,fontWeight:800,letterSpacing:".14em",textTransform:"uppercase"}}>Sei un operatore del territorio?</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(38px,5vw,58px)",lineHeight:1.08,color:"#032126",margin:"14px 0 22px"}}>Entra nel mondo BIMARIS fin dall'inizio.</h2>
          <p style={{fontSize:18,lineHeight:1.7,color:"#394850",margin:"0 auto 30px",maxWidth:720}}>BIMARIS sta selezionando operatori, produttori ed esperienze del territorio. Scopri il progetto e manifesta il tuo interesse senza alcun impegno.</p>
          <Link className="button" href="/operatori/interesse">MANIFESTA IL TUO INTERESSE</Link>
        </div>
      </section>
    </>
  );
}
