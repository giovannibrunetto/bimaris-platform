export type CultureStoryChapter={number:number;title:string;placeTitle:string;slug?:string;paragraphs:string[];transition:string[]};
export type CultureStory={key:string;title:string;subtitle:string;theme:string;intro:string[];chapters:CultureStoryChapter[];conclusion:string[]};

export const CULTURE_STORIES:CultureStory[]=[
  {
    "key": "medioevo",
    "title": "La Messina medievale",
    "subtitle": "Il porto, i sovrani e le persone che diedero forma alla città",
    "theme": "XII–XIII secolo",
    "intro": [
      "Nel 1184 Ibn Jubayr, viaggiatore e scrittore musulmano originario dell’Andalusia, arriva a Messina e trova una città che quasi fatica a contenere i suoi abitanti. Il viaggiatore andaluso descrive navi provenienti da molti paesi, merci e mercati pieni di attività. Non tutto gli piace: giudica duramente la sporcizia e l’accoglienza. Ma del porto riconosce un vantaggio concreto: anche le grandi imbarcazioni possono accostarsi vicino alla riva.",
      "È una voce che ci restituisce Messina prima delle fotografie e delle distruzioni, quando le sue relazioni con il Mediterraneo sono già parte della vita cittadina. Da quell’approdo arrivano persone; nella città trovano posto istituzioni, si costruiscono edifici, si formano appartenenze che possono durare più a lungo di una vita.",
      "Per seguirne le tracce cominciamo vicino al porto, dall’Annunziata. La chiesa appartiene alla stagione normanna del XII secolo. Il nome con cui la conosciamo, “dei Catalani”, racconta invece un’appartenenza successiva: altri avrebbero legato la propria comunità a un edificio già esistente.",
      "Qui possiamo fermarci. Non per immaginare Ibn Jubayr dentro questa chiesa, ma per incontrare una testimonianza della città del suo tempo."
    ],
    "chapters": [
      {
        "number": 1,
        "title": "PAUSA DI VISITA — Davanti all’Annunziata dei Catalani",
        "placeTitle": "Annunziata dei Catalani",
        "slug": "annunziata-dei-catalani",
        "paragraphs": [
          "La Santissima Annunziata è una chiesa di origine normanna, legata successivamente alla comunità catalana e alla sua confraternita. Il nome attuale ricorda questa appartenenza, non i costruttori del XII secolo.",
          "Se possiamo entrare, riconosciamo la divisione in tre navate e la cupola all’incrocio fra navata e transetto. All’esterno soffermiamoci sull’abside: il loggiato cieco, formato da archetti e colonnine, e l’alternanza delle pietre creano una decorazione geometrica. Nell’architettura normanna gli studiosi riconoscono riferimenti bizantini, arabi e romanici.",
          "Il terremoto del 1908 fece crollare molte costruzioni addossate che la nascondevano; i restauri successivi contribuirono all’aspetto odierno. È una testimonianza medievale restaurata, non un edificio rimasto immutato."
        ],
        "transition": [
          "La Messina descritta dal viaggiatore appartiene ancora al regno normanno. Dieci anni dopo, nel 1194, la Sicilia viene conquistata da Enrico VI di Svevia, imperatore del Sacro Romano Impero e figlio di Federico Barbarossa. Al suo fianco c’è la moglie, Costanza d’Altavilla, figlia di Ruggero II, il primo re normanno di Sicilia, ed erede della dinastia che aveva governato il regno. Il loro matrimonio lega la casa imperiale sveva alla famiglia dei sovrani normanni; con la conquista di Enrico, questo legame si traduce in un nuovo potere sull’isola.",
          "A Messina il passaggio fra le due dinastie entra anche nella storia della cattedrale: nata in età normanna, viene consacrata nel 1197 alla presenza di Enrico e Costanza, imperatore e imperatrice, re e regina di Sicilia. La chiesa maggiore accoglie così i sovrani nei quali si incontrano la dinastia che l’aveva vista sorgere e quella che governa ora il regno.",
          "Lasciamo l’Annunziata e raggiungiamo il Duomo. Non stiamo passando soltanto da una chiesa a un’altra: arriviamo nel luogo al quale è legato quell’incontro del 1197 fra città, autorità religiosa e dinastia regnante. Prima di proseguire con ciò che accadde in quello stesso settembre, fermiamoci davanti alla cattedrale."
        ]
      },
      {
        "number": 2,
        "title": "PAUSA DI VISITA — Davanti al Duomo",
        "placeTitle": "Duomo di Messina e Tesoro della Cattedrale",
        "slug": "duomo-messina-tesoro-cattedrale",
        "paragraphs": [
          "Il Duomo è la basilica cattedrale dedicata all’Assunta, sede della cattedra del vescovo e principale chiesa della diocesi. Di origine normanna e consacrato nel 1197, conserva questa funzione religiosa attraverso profonde trasformazioni.",
          "Guardiamo la facciata e il portale maggiore, realizzato in fasi fra XIV e XV secolo: la sua decorazione scolpita appartiene a un Medioevo più tardo rispetto alla consacrazione. Nell’interno, quando accessibile, le tre navate conducono verso il transetto e le absidi; colonne e archi scandiscono lo spazio basilicale. La decorazione musiva del settore absidale completa la lettura artistica dell’insieme.",
          "Terremoti e guerra ne hanno imposto ampie ricostruzioni, soprattutto dopo il 1908 e il 1943. Forme, materiali e decorazioni non appartengono tutti alla stessa epoca."
        ],
        "transition": [
          "Il settembre del 1197 non si chiude con la consacrazione. Il 28 Enrico VI muore proprio a Messina. La città che ha ospitato il sovrano per la cerimonia diventa anche il luogo della sua morte. Il regno entra in una fase nuova; il rapporto fra la monarchia e Messina proseguirà nella generazione successiva con il loro figlio, Federico II.",
          "Per ritrovare Federico II nella vita della città, lasciamo il Duomo e dirigiamoci verso Santa Maria Alemanna. Questa chiesa faceva parte di un complesso dell’Ordine teutonico che comprendeva anche un ospedale: un luogo di preghiera e di assistenza, inserito nei collegamenti che univano Messina agli altri porti del Mediterraneo.",
          "Una disposizione di Federico II, datata dagli editori al 1219, ci aiuta a capire come veniva sostenuta questa presenza. L’Ordine poteva inviare beni da Palermo alla propria sede di Messina, oppure verso Oltremare, senza pagare il portulatico, il tributo portuale. La «casa» messinese citata nel documento è la sede della comunità teutonica: Santa Maria Alemanna era la chiesa del suo complesso.",
          "Dietro quella concessione possiamo riconoscere una necessità concreta: far arrivare ciò che serviva a mantenere la comunità e le sue attività. Il porto, dal quale è cominciato il nostro racconto, torna così nella vita della città anche attraverso gli approvvigionamenti di un’istituzione religiosa e assistenziale.",
          "Ora che siamo davanti a Santa Maria Alemanna, fermiamoci a osservare la chiesa superstite di quel complesso. Riprenderemo poi il filo della storia, passando dal sostegno del sovrano a quello delle persone della città."
        ]
      },
      {
        "number": 3,
        "title": "PAUSA DI VISITA — A Santa Maria Alemanna",
        "placeTitle": "Santa Maria Alemanna",
        "slug": "santa-maria-alemanna",
        "paragraphs": [
          "Santa Maria Alemanna è un’ex chiesa medievale legata all’Ordine teutonico e a un complesso che comprendeva anche un ospedale. Oggi è utilizzata come spazio per attività culturali: la sua funzione è cambiata, mentre l’edificio conserva la memoria della presenza religiosa e assistenziale.",
          "Il carattere gotico si riconosce nelle arcate a sesto acuto e nei pilastri a fascio. Se possiamo osservarne l’interno, seguiamo le tre navate fino alle absidi e soffermiamoci sui capitelli scolpiti: sono dettagli che animano la struttura in pietra.",
          "Portale ricollocato e copertura richiedono di distinguere le parti antiche dagli interventi di restauro. Il documento del 1219 riguarda la casa dell’Ordine, non stabilisce l’anno di costruzione di ogni parte della chiesa."
        ],
        "transition": [
          "La casa messinese poteva dunque beneficiare di condizioni favorevoli per ricevere beni. Perché una presenza religiosa durasse, però, contavano anche le persone che sceglievano di sostenerla nel luogo in cui si stabiliva. Nel Duecento, la storia dei Frati Minori ci permette di seguire proprio questo contributo della società messinese.",
          "Le ricostruzioni storiche del cantiere di San Francesco ricordano tre donne della nobiltà cittadina: Violante Palizzi, Eleonora da Procida e Beatrice Belfiore. I loro nomi si affiancano a quelli dei religiosi nella storia della costruzione. Il 1254 è un riferimento ricorrente per lo sviluppo della chiesa; la ricostruzione diocesana ricorda anche una prima pietra benedetta da Alessandro IV a Napoli nel 1255.",
          "Non tutto comincia o finisce in queste due date. La presenza dei frati e il grande cantiere hanno fasi differenti. Ma il sostegno ricordato dalle fonti ci permette di vedere la città anche dalla parte di chi contribuisce a costruire un nuovo luogo, oltre che da quella del sovrano che concede un’esenzione.",
          "Sono iniziative diverse, non un’opera comune dei due ordini. A tenerle insieme è il radicamento nella stessa Messina: una casa da mantenere, una comunità che si insedia, persone che sostengono una costruzione.",
          "È per incontrare l’esito di questa seconda vicenda che proseguiamo fino a San Francesco all’Immacolata. Qui la storia di quel sostegno diventa la ragione per fermarci davanti alla chiesa e osservarne le dimensioni."
        ]
      },
      {
        "number": 4,
        "title": "PAUSA DI VISITA — A San Francesco all’Immacolata",
        "placeTitle": "San Francesco all'Immacolata",
        "slug": "san-francesco-immacolata",
        "paragraphs": [
          "San Francesco all’Immacolata è una chiesa francescana di origine duecentesca, oggi santuario diocesano, legata al convento dei Frati Minori Conventuali. Alla storia dei religiosi si sono aggiunti nel tempo il patronato cittadino, sepolture e la devozione all’Immacolata.",
          "Se possiamo entrare, osserviamo la grande aula unica, l’arco a sesto acuto verso il transetto e le alte finestre. All’esterno cerchiamo il settore delle tre absidi. La scala dello spazio e questi elementi aiutano a riconoscere il linguaggio gotico del complesso, senza attribuire al Duecento tutto ciò che vediamo.",
          "Trasformazioni barocche, incendio del 1884 e terremoto del 1908 ne hanno cambiato l’aspetto. Absidi e portali furono rimontati nella ricostruzione: l’edificio attuale comprende materiali recuperati e parti rifatte."
        ],
        "transition": []
      }
    ],
    "conclusion": [
      "Il cantiere francescano aggiunge un nuovo riferimento alla città e altri nomi alla sua storia. Sono questi gesti di sostegno, accanto alle decisioni dei sovrani e alle relazioni degli ordini religiosi, a dare consistenza alla Messina che abbiamo attraversato.",
      "Siamo partiti dalla città portuale osservata da un viaggiatore. Vi abbiamo incontrato una cattedrale consacrata alla presenza dei sovrani, una casa collegata a invii che attraversavano il mare, una chiesa sostenuta da persone della società cittadina. Nei luoghi dove ci siamo fermati, queste vicende hanno lasciato riferimenti riconoscibili, anche attraverso le trasformazioni dei secoli successivi.",
      "Il porto spiega perché Messina fosse raggiunta da tante relazioni. La storia delle persone e delle istituzioni ci ha mostrato come alcune di esse presero posto nella città. È con questa storia in mente che possiamo tornare a guardare i monumenti, riconoscendo dietro le costruzioni le presenze che contribuirono a farle vivere."
    ]
  },
  {
    "key": "cinquecento",
    "title": "La città del Cinquecento",
    "subtitle": "Difendere l'approdo, portare l'acqua, rappresentare il potere",
    "theme": "XVI secolo",
    "intro": [
      "Nel Cinquecento il porto di Messina è anche una questione militare. All'ingresso della sua falce, il Forte del Santissimo Salvatore occupa un luogo nel quale la difesa modifica una presenza religiosa più antica. Nel centro cittadino, due fontane traducono in immagini il rapporto con l'acqua e con il mare. Fra questi luoghi non corre una sola impresa edilizia: corre la storia di una città del regno di Sicilia, nella monarchia di Carlo V, che deve difendere il proprio approdo e dare forma pubblica alle proprie ambizioni."
    ],
    "chapters": [
      {
        "number": 1,
        "title": "Un monastero sulla soglia del porto",
        "placeTitle": "Forte del Santissimo Salvatore",
        "slug": "forte-santissimo-salvatore",
        "paragraphs": [
          "Nel 1535, durante la visita di Carlo V, viene decisa la trasformazione militare dell'area del Santissimo Salvatore. Il monastero deve lasciare spazio alla fortificazione. La scelta rende concreta la priorità assegnata all'ingresso del porto: il luogo occupato dalla comunità religiosa viene destinato a una funzione strategica.",
          "La trasformazione non è istantanea. La chiesa rimane inizialmente sul sito; nel 1549 un fulmine provoca l'esplosione del deposito di polvere e la sua distruzione. Il forte che osserviamo appartiene a questa storia di cambiamento del margine portuale, non alla semplice aggiunta di una difesa su uno spazio vuoto.",
          "La Messina di quegli anni non vive soltanto di esigenze militari. Un documento del 1530, descritto nel catalogo dell'Archivio di Stato, registra la conferma di Carlo V ai privilegi dei mercanti di seta e dei setaioli. È una traccia della presenza organizzata di interessi produttivi e commerciali nella città. Non dimostra che la seta finanziasse questo forte o le successive fontane: permette di riconoscere un ambiente economico nel quale la relazione con il sovrano passa anche attraverso concessioni e conferme."
        ],
        "transition": [
          "Mentre l'ingresso marittimo cambia, la città affronta anche il problema dell'approvvigionamento idrico. Sono vicende contemporanee, con obiettivi differenti. Il passaggio dal Santissimo Salvatore alla piazza del Duomo segue questo secondo intervento sulla vita urbana."
        ]
      },
      {
        "number": 2,
        "title": "L'acqua arriva nella piazza del Duomo",
        "placeTitle": "Fontana di Orione",
        "slug": "fontana-di-orione",
        "paragraphs": [
          "La Fontana di Orione, compiuta nel 1553, celebra l'acquedotto che porta in città le acque del Camaro. Il suo centro narrativo è un'opera pubblica: l'arrivo dell'acqua viene trasformato in un'immagine destinata allo spazio più rappresentativo di Messina.",
          "Il Senato aveva chiamato Giovanni Angelo Montorsoli nel 1547. La fontana nasce dunque da una committenza cittadina e da un lavoro artistico del quale possiamo seguire la cronologia, senza confondere l'avvio dell'incarico con il completamento dell'opera. Intorno a Orione, figura legata alle origini mitiche di Messina, i fiumi scolpiti ampliano l'orizzonte della piazza: Camaro, Nilo, Tevere ed Ebro accostano il corso d'acqua locale ad altri riferimenti geografici.",
          "Questa costruzione figurativa non è una carta dei commerci messinesi. Racconta come la città sceglie di rappresentare un intervento idrico, mettendo insieme il proprio mito, l'acqua del territorio e un linguaggio celebrativo più vasto. Anche l'abbondanza esibita dalla fontana va distinta dalle condizioni effettive di accesso all'acqua nelle singole abitazioni, che quest'opera da sola non documenta."
        ],
        "transition": [
          "Pochi anni dopo ritorna Montorsoli, ma cambia il soggetto e cambia il rapporto con l'acqua: dall'acquedotto celebrato davanti al Duomo si passa al mare e alla sua rappresentazione politica."
        ]
      },
      {
        "number": 3,
        "title": "Nettuno davanti allo Stretto",
        "placeTitle": "Fontana del Nettuno",
        "slug": "fontana-del-nettuno",
        "paragraphs": [
          "Nel 1557 la Fontana del Nettuno porta nello spazio pubblico il dio del mare e le figure di Scilla e Cariddi. Il mito dello Stretto è riconoscibile, ma la composizione appartiene anche al linguaggio politico della città cinquecentesca. La lettura proposta dal museo messinese vi riconosce la celebrazione di un ordine imperiale capace di dominare le forze rappresentate dai mostri marini.",
          "È un'interpretazione dell'immagine e del suo programma celebrativo. Non prova che i pericoli del mare fossero scomparsi né che tutti gli abitanti condividessero la medesima idea del potere. La fontana mostra piuttosto ciò che la committenza decide di affermare pubblicamente, usando una storia che appartiene proprio a questo tratto di mare.",
          "Anche il suo rapporto con il paesaggio è cambiato: l'opera era collocata nell'area portuale e venne trasferita e ruotata nel 1934. La sistemazione odierna non restituisce senza differenze il punto di vista cinquecentesco. Sapere che la fontana si è spostata aiuta a non attribuire al suo orientamento attuale un significato originario."
        ],
        "transition": []
      }
    ],
    "conclusion": [
      "Il Santissimo Salvatore, Orione e Nettuno rendono visibili tre decisioni diverse: presidiare l'accesso al porto, celebrare l'arrivo dell'acqua, rappresentare il dominio sul mare. Le tiene insieme la Messina del Cinquecento, con le sue istituzioni cittadine e il rapporto con la monarchia. Il forte e le fontane non descrivono da soli ogni aspetto della sua società; conservano però le tracce materiali di ciò che quella città volle proteggere, realizzare e dichiarare."
    ]
  },
  {
    "key": "1908-rinascita",
    "title": "La città che rinasce",
    "subtitle": "Dopo il 1908: salvare, abitare, ricostruire",
    "theme": "Dopo il 1908",
    "intro": [
      "Il terremoto del 28 dicembre 1908 interrompe la vita di Messina e sconvolge gli spazi nei quali si svolgeva. La ricostruzione che segue non ha un unico inizio e, soprattutto, non ha una sola data di conclusione. Recuperare un'opera dalle macerie, riprendere le lezioni in una struttura provvisoria e riaprire una cattedrale sono azioni diverse, necessarie in tempi diversi.",
      "Il museo, il Duomo, la Galleria Vittorio Emanuele III e il campanile permettono di seguirne alcune. Fra questi luoghi occorre lasciare spazio anche a una storia meno monumentale: come abitare e far funzionare la città mentre i cantieri permanenti devono ancora prendere forma."
    ],
    "chapters": [
      {
        "number": 1,
        "title": "Dare un futuro a ciò che si può salvare",
        "placeTitle": "Museo Regionale Interdisciplinare di Messina — MuMe",
        "slug": "mume-museo-regionale-messina",
        "paragraphs": [
          "Il primo passaggio si comprende al museo. Dopo il disastro, Antonino Salinas e i suoi collaboratori partecipano al recupero del patrimonio disperso fra gli edifici colpiti. Opere e frammenti vengono raccolti nell'area del San Salvatore dei Greci. Nel 1911 la filanda Mellinghoff diventa sede del museo; nel 1914 l'istituzione assume il carattere di Museo Nazionale.",
          "Questa sequenza appartiene alla ricostruzione, anche se non produce subito una nuova facciata nella città. Recuperare e riunire significa dare una destinazione a materiali che hanno perduto il proprio contesto. Nel museo, opere nate per chiese e palazzi possono sopravvivere senza che sopravviva allo stesso modo l'edificio dal quale provengono.",
          "Il MuMe di oggi consente di incontrare parte di quel patrimonio. Non tutto ciò che custodisce arrivò nelle medesime circostanze, ma la vicenda del recupero dopo il 1908 è essenziale alla sua storia. Ciò che si salva non ricompone automaticamente la Messina precedente: rende possibile trasmetterne testimonianze anche quando il tessuto urbano viene trasformato."
        ],
        "transition": [
          "Il recupero delle opere procede mentre la popolazione e le istituzioni devono trovare spazi utilizzabili. Per capire la città che rinasce bisogna seguire anche questa ricostruzione quotidiana, precedente al completamento dei suoi edifici rappresentativi."
        ]
      },
      {
        "number": 2,
        "title": "Una città deve tornare a funzionare",
        "placeTitle": "",
        "paragraphs": [
          "Le abitazioni provvisorie rispondono a un bisogno immediato, ma la loro durata supera spesso l'emergenza per la quale erano state pensate. A Messina alcune strutture nate dopo il terremoto rimarranno utilizzate per decenni. La distanza fra provvisorio e permanente diventa così una parte della storia urbana, non soltanto una fase da oltrepassare prima che cominci la ricostruzione vera e propria.",
          "Anche la continuità delle istituzioni deve essere costruita. Nel 1909 si discute persino della soppressione o del trasferimento dell'Università. La ripresa delle attività in strutture provvisorie, nell'anno accademico 1909–1910, dà alla città una risposta concreta: l'insegnamento può ricominciare prima che esista una sede definitiva. Non è il ritorno alle condizioni precedenti; è un modo di mantenere un'attività cittadina dentro uno spazio ancora precario.",
          "Nel 1911 viene approvato il piano regolatore associato al nome di Luigi Borzì. La ricostruzione prende una forma urbana pianificata, nella quale contano il tracciato delle strade e i servizi, oltre ai singoli edifici. Approvare un piano, tuttavia, non significa aver già realizzato la città che descrive. Fra le decisioni, i progetti e le opere compiute si collocano anni di lavoro.",
          "Per questo le date dei nuovi monumenti non possono diventare date di soluzione delle condizioni abitative. La permanenza di strutture nate come provvisorie obbliga a tenere insieme due immagini di Messina: quella che torna a riconoscersi nei suoi edifici pubblici e quella nella quale avere uno spazio stabile continua a essere una necessità. La storia dei cantieri non coincide con il calendario della vita di tutti gli abitanti."
        ],
        "transition": [
          "Su questo sfondo, negli anni Venti alcuni cantieri rendono nuovamente riconoscibili le funzioni religiose e commerciali del centro. Il Duomo e la Galleria permettono di osservare due risposte differenti alla stessa città da ricostruire."
        ]
      },
      {
        "number": 3,
        "title": "Il Duomo e la Galleria: due modi di rifare il centro",
        "placeTitle": "Duomo di Messina e Galleria Vittorio Emanuele III",
        "slug": "duomo-messina-tesoro-cattedrale",
        "paragraphs": [
          "Il Duomo riapre al culto nel 1929. La ricostruzione restituisce alla città la sua cattedrale attraverso un edificio nel quale la memoria delle forme antiche e l'opera contemporanea non possono essere separate. Guardarlo come un resto medievale rimasto intatto cancellerebbe proprio il lavoro compiuto dopo il terremoto.",
          "Negli stessi anni prende forma la Galleria Vittorio Emanuele III, costruita fra il 1924 e il 1929 su progetto di Camillo Puglisi Allegra. Il centro acquista uno spazio coperto nel quale il progetto riunisce commercio, uffici e residenze. La Galleria non ricostruisce la cattedrale né ne continua il cantiere: rende visibile un altro obiettivo della ricostruzione, organizzare nuovamente attività e percorsi della città.",
          "Accostare i due edifici non significa attribuire loro un'unica funzione. La loro prossimità cronologica permette di seguire, nella Messina degli anni Venti, il ritorno di luoghi collettivi differenti. Le rispettive inaugurazioni segnano risultati importanti, ma appartengono a una ricostruzione che procede con tempi diversi."
        ],
        "transition": [
          "Accanto al Duomo, un ulteriore cantiere prolunga questa storia negli anni Trenta. Qui la ricostruzione prende anche la forma di un nuovo modo di segnare il tempo pubblico."
        ]
      },
      {
        "number": 4,
        "title": "Il campanile non chiude tutti i cantieri",
        "placeTitle": "Campanile del Duomo e Orologio Astronomico",
        "slug": "campanile-orologio-astronomico-messina",
        "paragraphs": [
          "Nel 1933 entra in funzione l'orologio astronomico realizzato dalla ditta Ungerer per il campanile del Duomo. I suoi meccanismi e le sue figure diventano una presenza riconoscibile nella piazza ricostruita. Non sono un congegno medievale tornato a funzionare: appartengono alla nuova stagione della città.",
          "Anche la storia della torre richiede questa distinzione. Il precedente campanile era stato demolito nel 1863: non si può quindi raccontare la torre novecentesca come la semplice ricomposizione di quella abbattuta dal terremoto. Nel luogo che richiama una lunga continuità religiosa e civica, il campanile introduce una realizzazione del proprio tempo.",
          "Il 1933 offre una data precisa per questo risultato, non una conclusione generale della rinascita. Alcune strutture provvisorie continuano a essere abitate; inoltre, nel 1943, i bombardamenti colpiscono nuovamente il Duomo e provocano nuove distruzioni. La ricostruzione successiva al 1908 non mette la città al riparo da altre fratture."
        ],
        "transition": []
      }
    ],
    "conclusion": [
      "Il museo conserva ciò che è stato recuperato, il Duomo racconta il lavoro necessario a restituire una presenza antica, la Galleria mostra un centro riprogettato, il campanile aggiunge un nuovo segno alla piazza. Fra queste realizzazioni resta la storia delle persone che devono abitare, studiare e usare Messina durante i lavori. Alcune funzioni ripartono in spazi provvisori, gli edifici tornano in tempi diversi e altre necessità durano più a lungo. È questa distanza fra i tempi della città a rendere la ricostruzione una vicenda leggibile nei luoghi, oltre che nelle date delle inaugurazioni."
    ]
  }
];

export const CULTURE_STORIES_BY_KEY=new Map<string,CultureStory>(CULTURE_STORIES.map(story=>[story.key,story] as const));
