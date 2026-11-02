export type CultureStoryChapter={number:number;title:string;placeTitle:string;slug?:string;paragraphs:string[];transition:string[]};
export type CultureStory={key:string;title:string;subtitle:string;theme:string;intro:string[];chapters:CultureStoryChapter[];conclusion:string[]};

export const CULTURE_STORIES:CultureStory[]=[
{
  key:"medioevo",
  title:"La Messina medievale",
  subtitle:"Porto, privilegi e conflitti, 1184–1233",
  theme:"1184–1233",
  intro:[
    "Il porto di Messina entra nella storia anche attraverso gli occhi di chi vi arriva. Nel 1184 il viaggiatore andaluso Ibn Jubayr descrive una città frequentata da mercanti di molti paesi e un approdo nel quale le grandi navi possono accostarsi vicino alla riva. Il suo sguardo non è celebrativo: registra anche aspetti sgradevoli della città. Proprio questa voce, con le sue osservazioni e i suoi giudizi, permette di avvicinare una Messina concreta, prima che i suoi edifici diventino monumenti da visitare.",
    "Fra quella testimonianza e la repressione ordinata da Federico II nel 1233 passa circa mezzo secolo. A tenere insieme questi anni è una questione che riguarda la vita del porto e il governo della città: quali vantaggi offre la vicinanza al sovrano, e che cosa accade quando gli interessi cittadini entrano in conflitto con la sua autorità?"
  ],
  chapters:[
    {
      number:1,
      title:"Il porto che accoglie, la città che resiste",
      placeTitle:"",
      paragraphs:[
        "Per Ibn Jubayr, Messina è un luogo nel quale convergono traffici e viaggi. La posizione sullo Stretto conta, ma conta anche la possibilità materiale di avvicinare le navi alla città. Il commercio non è soltanto un'attività che si svolge davanti alle case: contribuisce a collocare Messina nelle relazioni fra la Sicilia e chi attraversa il Mediterraneo.",
        "Lo stesso approdo riceve, pochi anni dopo, uomini diretti alla crociata. Nel 1190 Riccardo d'Inghilterra arriva in Sicilia; il soggiorno dei crociati si prolunga fino al 1191. La loro presenza non si risolve in una sosta pacifica. Le cronache della spedizione raccontano lo scontro con gli abitanti e la presa della città da parte degli uomini di Riccardo, accompagnata dal saccheggio.",
        "Sono testimonianze che guardano agli avvenimenti dalla parte della spedizione: non restituiscono tutte le voci di Messina. Mostrano però un fatto decisivo per questo racconto. Essere un porto utile alle grandi imprese mediterranee significa anche dover affrontare forze capaci di imporre la propria presenza. Il viaggiatore del 1184 e i crociati del 1190 non descrivono due città diverse: rendono visibili possibilità e tensioni dello stesso approdo."
      ],
      transition:[
        "La storia di quei contingenti appartiene alla crociata; quella del governo di Messina rimane legata al regno di Sicilia. È su questo secondo piano che, negli anni successivi, cambia il rapporto con la monarchia."
      ]
    },
    {
      number:2,
      title:"Il settembre del sovrano",
      placeTitle:"Duomo di Messina e Tesoro della Cattedrale",
      slug:"duomo-messina-tesoro-cattedrale",
      paragraphs:[
        "Nel 1194 Enrico VI conquista il regno di Sicilia. Tre anni dopo, a Messina, la consacrazione della cattedrale si svolge alla presenza sua e di Costanza. Il Duomo entra così nel racconto attraverso una cerimonia che riunisce autorità religiosa e dinastia regnante.",
        "Il settembre 1197 contiene anche un altro avvenimento: il 28 Enrico VI muore a Messina. La città che ha ospitato la manifestazione pubblica della monarchia diventa il luogo della morte del sovrano. Non occorre immaginare i suoi ultimi giorni per cogliere la vicinanza fra questi due eventi e la discontinuità che aprono nella storia del regno.",
        "La cattedrale odierna non conserva intatto l'edificio che vide quella consacrazione. Distruzioni e ricostruzioni successive impediscono di sovrapporre senza cautele ciò che osserviamo a ciò che esisteva nel XII secolo. Rimane però la continuità del luogo: il Duomo permette di situare a Messina un passaggio della storia dinastica siciliana, senza ridurlo a una successione di nomi di sovrani."
      ],
      transition:[
        "Il potere regio non si manifesta soltanto nelle cerimonie. Lo si incontra anche nelle disposizioni che stabiliscono chi possa muovere merci e a quali condizioni. Un documento del secolo successivo sposta il racconto dalla presenza del sovrano agli effetti dei suoi atti."
      ]
    },
    {
      number:3,
      title:"Un privilegio prende la via del mare",
      placeTitle:"Santa Maria Alemanna",
      slug:"santa-maria-alemanna",
      paragraphs:[
        "Santa Maria Alemanna conserva la memoria dell'insediamento messinese dell'Ordine teutonico. La sua storia mette in relazione la città con istituzioni religiose e assistenziali attive sulle rotte mediterranee. Per comprendere questa presenza, un'esenzione può essere più eloquente di una descrizione architettonica.",
        "Una disposizione di Federico II, datata dagli editori al 1219 e conservata in una copia autentica successiva, concede un vantaggio concreto: gli invii dell'Ordine da Palermo verso la casa di Messina o verso Oltremare sono esenti dal portulatico, il tributo portuale. Il documento non ci dice quante navi o quante merci viaggiassero, ma mostra che quella circolazione godeva di una condizione favorevole.",
        "L'Alemanna diventa così il riferimento visibile di una rete che oltrepassa Messina. Non è necessario attribuire a Federico la fondazione della chiesa per riconoscere il ruolo della monarchia nella storia dell'istituzione. Il documento attesta una concessione, non l'apertura del cantiere che oggi cerchiamo di leggere nelle sue pietre."
      ],
      transition:[
        "Un'esenzione destinata a un ordine religioso e le libertà rivendicate dagli abitanti non sono la stessa cosa. Entrambe, tuttavia, conducono alla questione dei diritti e di chi possa definirli. Negli anni Trenta il rapporto fra la città e Federico II assume la forma del conflitto aperto."
      ]
    },
    {
      number:4,
      title:"Il ritorno al Duomo",
      placeTitle:"Duomo di Messina e Tesoro della Cattedrale",
      slug:"duomo-messina-tesoro-cattedrale",
      paragraphs:[
        "Nel 1232 a Messina scoppia una rivolta. Riccardo di San Germano collega la sedizione all'azione del giustiziere Riccardo di Montenero: secondo la sua cronaca, i cittadini sostenevano che egli agisse contro le loro libertà. È una rivendicazione riferita da una fonte, non la prova di una città unanime né di un'indipendenza paragonabile a quella di un comune moderno.",
        "Nel 1233 Federico entra a Messina e la rivolta viene repressa. Il Breve Chronicon de rebus Siculis racconta un episodio che riporta la storia nella cattedrale. Qui il sovrano avrebbe rassicurato i maggiori e i minori della città, concedendo il perdono per le offese commesse. La stessa cronaca riferisce che, trascorsi alcuni giorni, seguirono condanne a morte, incarcerazioni e fughe. Riccardo di San Germano ricorda a sua volta la punizione dei responsabili della sedizione, fra i quali Martino Mallone.",
        "Le due testimonianze non sono un verbale concorde di ogni momento della repressione. Il passaggio in cattedrale appartiene al racconto del Breve Chronicon e va letto come tale. È però sufficiente a dare al ritorno al Duomo un significato diverso dalla consacrazione del 1197: nello stesso luogo, alla rappresentazione della monarchia si affianca ora la memoria del suo confronto con la città."
      ],
      transition:[]
    }
  ],
  conclusion:[
    "Messina non emerge da questi anni come un porto separato dalla politica. Navi, esenzioni e libertà rivendicate appartengono alla medesima storia urbana. Guardare il porto, entrare nella piazza del Duomo e raggiungere l'Alemanna significa seguire le tracce di questa relazione: la monarchia offre opportunità, regola i movimenti e, quando il conflitto si apre, esercita la forza. È una parte circoscritta del Medioevo messinese, ma conserva una domanda concreta su chi abbia il potere di decidere le condizioni della vita cittadina."
  ]
},
{
  key:"cinquecento",
  title:"La città del Cinquecento",
  subtitle:"Difendere l'approdo, portare l'acqua, rappresentare il potere",
  theme:"XVI secolo",
  intro:[
    "Nel Cinquecento il porto di Messina è anche una questione militare. All'ingresso della sua falce, il Forte del Santissimo Salvatore occupa un luogo nel quale la difesa modifica una presenza religiosa più antica. Nel centro cittadino, due fontane traducono in immagini il rapporto con l'acqua e con il mare. Fra questi luoghi non corre una sola impresa edilizia: corre la storia di una città del regno di Sicilia, nella monarchia di Carlo V, che deve difendere il proprio approdo e dare forma pubblica alle proprie ambizioni."
  ],
  chapters:[
    {
      number:1,
      title:"Un monastero sulla soglia del porto",
      placeTitle:"Forte del Santissimo Salvatore",
      slug:"forte-santissimo-salvatore",
      paragraphs:[
        "Nel 1535, durante la visita di Carlo V, viene decisa la trasformazione militare dell'area del Santissimo Salvatore. Il monastero deve lasciare spazio alla fortificazione. La scelta rende concreta la priorità assegnata all'ingresso del porto: il luogo occupato dalla comunità religiosa viene destinato a una funzione strategica.",
        "La trasformazione non è istantanea. La chiesa rimane inizialmente sul sito; nel 1549 un fulmine provoca l'esplosione del deposito di polvere e la sua distruzione. Il forte che osserviamo appartiene a questa storia di cambiamento del margine portuale, non alla semplice aggiunta di una difesa su uno spazio vuoto.",
        "La Messina di quegli anni non vive soltanto di esigenze militari. Un documento del 1530, descritto nel catalogo dell'Archivio di Stato, registra la conferma di Carlo V ai privilegi dei mercanti di seta e dei setaioli. È una traccia della presenza organizzata di interessi produttivi e commerciali nella città. Non dimostra che la seta finanziasse questo forte o le successive fontane: permette di riconoscere un ambiente economico nel quale la relazione con il sovrano passa anche attraverso concessioni e conferme."
      ],
      transition:[
        "Mentre l'ingresso marittimo cambia, la città affronta anche il problema dell'approvvigionamento idrico. Sono vicende contemporanee, con obiettivi differenti. Il passaggio dal Santissimo Salvatore alla piazza del Duomo segue questo secondo intervento sulla vita urbana."
      ]
    },
    {
      number:2,
      title:"L'acqua arriva nella piazza del Duomo",
      placeTitle:"Fontana di Orione",
      slug:"fontana-di-orione",
      paragraphs:[
        "La Fontana di Orione, compiuta nel 1553, celebra l'acquedotto che porta in città le acque del Camaro. Il suo centro narrativo è un'opera pubblica: l'arrivo dell'acqua viene trasformato in un'immagine destinata allo spazio più rappresentativo di Messina.",
        "Il Senato aveva chiamato Giovanni Angelo Montorsoli nel 1547. La fontana nasce dunque da una committenza cittadina e da un lavoro artistico del quale possiamo seguire la cronologia, senza confondere l'avvio dell'incarico con il completamento dell'opera. Intorno a Orione, figura legata alle origini mitiche di Messina, i fiumi scolpiti ampliano l'orizzonte della piazza: Camaro, Nilo, Tevere ed Ebro accostano il corso d'acqua locale ad altri riferimenti geografici.",
        "Questa costruzione figurativa non è una carta dei commerci messinesi. Racconta come la città sceglie di rappresentare un intervento idrico, mettendo insieme il proprio mito, l'acqua del territorio e un linguaggio celebrativo più vasto. Anche l'abbondanza esibita dalla fontana va distinta dalle condizioni effettive di accesso all'acqua nelle singole abitazioni, che quest'opera da sola non documenta."
      ],
      transition:[
        "Pochi anni dopo ritorna Montorsoli, ma cambia il soggetto e cambia il rapporto con l'acqua: dall'acquedotto celebrato davanti al Duomo si passa al mare e alla sua rappresentazione politica."
      ]
    },
    {
      number:3,
      title:"Nettuno davanti allo Stretto",
      placeTitle:"Fontana del Nettuno",
      slug:"fontana-del-nettuno",
      paragraphs:[
        "Nel 1557 la Fontana del Nettuno porta nello spazio pubblico il dio del mare e le figure di Scilla e Cariddi. Il mito dello Stretto è riconoscibile, ma la composizione appartiene anche al linguaggio politico della città cinquecentesca. La lettura proposta dal museo messinese vi riconosce la celebrazione di un ordine imperiale capace di dominare le forze rappresentate dai mostri marini.",
        "È un'interpretazione dell'immagine e del suo programma celebrativo. Non prova che i pericoli del mare fossero scomparsi né che tutti gli abitanti condividessero la medesima idea del potere. La fontana mostra piuttosto ciò che la committenza decide di affermare pubblicamente, usando una storia che appartiene proprio a questo tratto di mare.",
        "Anche il suo rapporto con il paesaggio è cambiato: l'opera era collocata nell'area portuale e venne trasferita e ruotata nel 1934. La sistemazione odierna non restituisce senza differenze il punto di vista cinquecentesco. Sapere che la fontana si è spostata aiuta a non attribuire al suo orientamento attuale un significato originario."
      ],
      transition:[]
    }
  ],
  conclusion:[
    "Il Santissimo Salvatore, Orione e Nettuno rendono visibili tre decisioni diverse: presidiare l'accesso al porto, celebrare l'arrivo dell'acqua, rappresentare il dominio sul mare. Le tiene insieme la Messina del Cinquecento, con le sue istituzioni cittadine e il rapporto con la monarchia. Il forte e le fontane non descrivono da soli ogni aspetto della sua società; conservano però le tracce materiali di ciò che quella città volle proteggere, realizzare e dichiarare."
  ]
},
{
  key:"1908-rinascita",
  title:"La città che rinasce",
  subtitle:"Dopo il 1908: salvare, abitare, ricostruire",
  theme:"Dopo il 1908",
  intro:[
    "Il terremoto del 28 dicembre 1908 interrompe la vita di Messina e sconvolge gli spazi nei quali si svolgeva. La ricostruzione che segue non ha un unico inizio e, soprattutto, non ha una sola data di conclusione. Recuperare un'opera dalle macerie, riprendere le lezioni in una struttura provvisoria e riaprire una cattedrale sono azioni diverse, necessarie in tempi diversi.",
    "Il museo, il Duomo, la Galleria Vittorio Emanuele III e il campanile permettono di seguirne alcune. Fra questi luoghi occorre lasciare spazio anche a una storia meno monumentale: come abitare e far funzionare la città mentre i cantieri permanenti devono ancora prendere forma."
  ],
  chapters:[
    {
      number:1,
      title:"Dare un futuro a ciò che si può salvare",
      placeTitle:"Museo Regionale Interdisciplinare di Messina — MuMe",
      slug:"mume-museo-regionale-messina",
      paragraphs:[
        "Il primo passaggio si comprende al museo. Dopo il disastro, Antonino Salinas e i suoi collaboratori partecipano al recupero del patrimonio disperso fra gli edifici colpiti. Opere e frammenti vengono raccolti nell'area del San Salvatore dei Greci. Nel 1911 la filanda Mellinghoff diventa sede del museo; nel 1914 l'istituzione assume il carattere di Museo Nazionale.",
        "Questa sequenza appartiene alla ricostruzione, anche se non produce subito una nuova facciata nella città. Recuperare e riunire significa dare una destinazione a materiali che hanno perduto il proprio contesto. Nel museo, opere nate per chiese e palazzi possono sopravvivere senza che sopravviva allo stesso modo l'edificio dal quale provengono.",
        "Il MuMe di oggi consente di incontrare parte di quel patrimonio. Non tutto ciò che custodisce arrivò nelle medesime circostanze, ma la vicenda del recupero dopo il 1908 è essenziale alla sua storia. Ciò che si salva non ricompone automaticamente la Messina precedente: rende possibile trasmetterne testimonianze anche quando il tessuto urbano viene trasformato."
      ],
      transition:[
        "Il recupero delle opere procede mentre la popolazione e le istituzioni devono trovare spazi utilizzabili. Per capire la città che rinasce bisogna seguire anche questa ricostruzione quotidiana, precedente al completamento dei suoi edifici rappresentativi."
      ]
    },
    {
      number:2,
      title:"Una città deve tornare a funzionare",
      placeTitle:"",
      paragraphs:[
        "Le abitazioni provvisorie rispondono a un bisogno immediato, ma la loro durata supera spesso l'emergenza per la quale erano state pensate. A Messina alcune strutture nate dopo il terremoto rimarranno utilizzate per decenni. La distanza fra provvisorio e permanente diventa così una parte della storia urbana, non soltanto una fase da oltrepassare prima che cominci la ricostruzione vera e propria.",
        "Anche la continuità delle istituzioni deve essere costruita. Nel 1909 si discute persino della soppressione o del trasferimento dell'Università. La ripresa delle attività in strutture provvisorie, nell'anno accademico 1909–1910, dà alla città una risposta concreta: l'insegnamento può ricominciare prima che esista una sede definitiva. Non è il ritorno alle condizioni precedenti; è un modo di mantenere un'attività cittadina dentro uno spazio ancora precario.",
        "Nel 1911 viene approvato il piano regolatore associato al nome di Luigi Borzì. La ricostruzione prende una forma urbana pianificata, nella quale contano il tracciato delle strade e i servizi, oltre ai singoli edifici. Approvare un piano, tuttavia, non significa aver già realizzato la città che descrive. Fra le decisioni, i progetti e le opere compiute si collocano anni di lavoro.",
        "Per questo le date dei nuovi monumenti non possono diventare date di soluzione delle condizioni abitative. La permanenza di strutture nate come provvisorie obbliga a tenere insieme due immagini di Messina: quella che torna a riconoscersi nei suoi edifici pubblici e quella nella quale avere uno spazio stabile continua a essere una necessità. La storia dei cantieri non coincide con il calendario della vita di tutti gli abitanti."
      ],
      transition:[
        "Su questo sfondo, negli anni Venti alcuni cantieri rendono nuovamente riconoscibili le funzioni religiose e commerciali del centro. Il Duomo e la Galleria permettono di osservare due risposte differenti alla stessa città da ricostruire."
      ]
    },
    {
      number:3,
      title:"Il Duomo e la Galleria: due modi di rifare il centro",
      placeTitle:"Duomo di Messina e Galleria Vittorio Emanuele III",
      slug:"duomo-messina-tesoro-cattedrale",
      paragraphs:[
        "Il Duomo riapre al culto nel 1929. La ricostruzione restituisce alla città la sua cattedrale attraverso un edificio nel quale la memoria delle forme antiche e l'opera contemporanea non possono essere separate. Guardarlo come un resto medievale rimasto intatto cancellerebbe proprio il lavoro compiuto dopo il terremoto.",
        "Negli stessi anni prende forma la Galleria Vittorio Emanuele III, costruita fra il 1924 e il 1929 su progetto di Camillo Puglisi Allegra. Il centro acquista uno spazio coperto nel quale il progetto riunisce commercio, uffici e residenze. La Galleria non ricostruisce la cattedrale né ne continua il cantiere: rende visibile un altro obiettivo della ricostruzione, organizzare nuovamente attività e percorsi della città.",
        "Accostare i due edifici non significa attribuire loro un'unica funzione. La loro prossimità cronologica permette di seguire, nella Messina degli anni Venti, il ritorno di luoghi collettivi differenti. Le rispettive inaugurazioni segnano risultati importanti, ma appartengono a una ricostruzione che procede con tempi diversi."
      ],
      transition:[
        "Accanto al Duomo, un ulteriore cantiere prolunga questa storia negli anni Trenta. Qui la ricostruzione prende anche la forma di un nuovo modo di segnare il tempo pubblico."
      ]
    },
    {
      number:4,
      title:"Il campanile non chiude tutti i cantieri",
      placeTitle:"Campanile del Duomo e Orologio Astronomico",
      slug:"campanile-orologio-astronomico-messina",
      paragraphs:[
        "Nel 1933 entra in funzione l'orologio astronomico realizzato dalla ditta Ungerer per il campanile del Duomo. I suoi meccanismi e le sue figure diventano una presenza riconoscibile nella piazza ricostruita. Non sono un congegno medievale tornato a funzionare: appartengono alla nuova stagione della città.",
        "Anche la storia della torre richiede questa distinzione. Il precedente campanile era stato demolito nel 1863: non si può quindi raccontare la torre novecentesca come la semplice ricomposizione di quella abbattuta dal terremoto. Nel luogo che richiama una lunga continuità religiosa e civica, il campanile introduce una realizzazione del proprio tempo.",
        "Il 1933 offre una data precisa per questo risultato, non una conclusione generale della rinascita. Alcune strutture provvisorie continuano a essere abitate; inoltre, nel 1943, i bombardamenti colpiscono nuovamente il Duomo e provocano nuove distruzioni. La ricostruzione successiva al 1908 non mette la città al riparo da altre fratture."
      ],
      transition:[]
    }
  ],
  conclusion:[
    "Il museo conserva ciò che è stato recuperato, il Duomo racconta il lavoro necessario a restituire una presenza antica, la Galleria mostra un centro riprogettato, il campanile aggiunge un nuovo segno alla piazza. Fra queste realizzazioni resta la storia delle persone che devono abitare, studiare e usare Messina durante i lavori. Alcune funzioni ripartono in spazi provvisori, gli edifici tornano in tempi diversi e altre necessità durano più a lungo. È questa distanza fra i tempi della città a rendere la ricostruzione una vicenda leggibile nei luoghi, oltre che nelle date delle inaugurazioni."
  ]
}
];

export const CULTURE_STORIES_BY_KEY=new Map<string,CultureStory>(CULTURE_STORIES.map(story=>[story.key,story] as const));
