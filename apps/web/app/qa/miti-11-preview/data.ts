export type QaStory = {
  slug: string;
  title: string;
  storyType: string;
  excerpt: string;
  body: string[];
  image: string;
  imagePosition: string;
  imageMode?: "cover" | "contain-framed";
};

export const qaStories: QaStory[] = [
  {
    slug: "orione-origini-mitiche-messina",
    title: "Orione e le origini mitiche di Messina",
    storyType: "Mito classico",
    excerpt: "Prima della fontana, c'era il gigante. Orione appartiene a un racconto antico nel quale la sua forza arriva fino a modificare il paesaggio di Messina: il porto, il mare e Capo Peloro.",
    image: "/qa/miti-copertine/Orione_copertina_v1.png",
    imagePosition: "center 35%",
    body: [
      "In piazza Duomo, la Fontana di Orione dà un volto a una delle origini mitiche di Messina. L'opera di Giovanni Angelo Montorsoli, ultimata nel 1553, porta nel cuore della città un personaggio al quale gli antichi attribuivano la forza necessaria per modellare una costa.",
      "Diodoro Siculo, nel quarto libro della Biblioteca storica, racconta che Orione superava gli altri eroi per statura e vigore. Amava la caccia e le grandi opere. Per Zanclo, re della città allora chiamata Zancle, avrebbe formato il porto costruendo un argine.",
      "Lo stesso capitolo collega il gigante anche al promontorio del Peloro: qui Orione avrebbe ampliato la terra sul mare e innalzato un santuario a Poseidone. Diodoro riferisce questa parte a una tradizione attribuita a Esiodo. Sono racconti mitici, nei quali le dimensioni del paesaggio trovano una misura nella forza straordinaria di un eroe.",
      "La fontana cinquecentesca appartiene invece alla storia della città. Nelle sue figure compare anche il Camaro, il corso d'acqua legato all'approvvigionamento dell'acquedotto messinese. L'antico costruttore di approdi viene così accolto in un monumento dedicato anche all'acqua che serve la comunità.",
      "Il porto, Capo Peloro e la piazza permettono di seguire questa memoria attraverso luoghi diversi. Non occorre cercarvi le prove delle imprese del gigante: è il loro rapporto con il racconto a rendere visibile il modo in cui Messina ha immaginato la propria origine."
    ]
  },
  {
    slug: "crono-falce-porto",
    title: "Crono e la falce del porto",
    storyType: "Mito classico legato al paesaggio",
    excerpt: "La curva del porto conserva l'immagine di una falce. Gli antichi la riconobbero nel nome di Zancle e la collegarono a Crono, portando sulla costa messinese un racconto sulle origini degli dèi.",
    image: "/qa/miti-copertine/Crono_copertina_v1.png",
    imagePosition: "center 80%",
    body: [
      "Il porto di Messina si raccoglie dentro una curva che richiama la lama di una falce. Il legame fra questa forma e il nome antico della città è già in Tucidide: Zancle, scrive lo storico, veniva dal termine con cui i Siculi indicavano proprio la falce.",
      "Intorno a quell'immagine si dispone anche un mito. Nella Teogonia di Esiodo, Gea prepara una falce e la affida al figlio Crono. Con quell'arma il titano mutila il padre Urano, interrompendone il dominio. È un episodio della mitologia greca che riguarda il conflitto fra generazioni divine.",
      "Il collegamento preciso con Messina emerge in Callimaco. Negli Aitia, mentre si raccontano le origini di Zancle, la falce di Crono è nascosta sotto terra nel luogo della città; i fondatori vi costruiscono attorno strutture difensive di legno. Il frammento conserva così una relazione fra l'arma divina e l'insediamento.",
      "Il profilo del porto e l'oggetto del mito finiscono per richiamarsi. Da questo incontro nasce la possibilità di leggere la falce costiera come una traccia del mondo degli dèi: una lettura simbolica del paesaggio, che non spiega la formazione materiale dell'approdo.",
      "Osservare il porto con questo racconto in mente significa riconoscere quanto possa durare un'immagine. Una curva della costa diventa un nome; il nome custodisce un oggetto; quell'oggetto apre una storia molto più grande della città. La falce tiene insieme questi passaggi e restituisce a Messina una delle sue più antiche geografie dell'immaginazione."
    ]
  },
  {
    slug: "dina-e-clarenza",
    title: "Dina e Clarenza",
    storyType: "Racconto storico-leggendario e memoria civica",
    excerpt: "Sul campanile del Duomo, due donne scandiscono ancora il tempo della città. Sono Dina e Clarenza: nei loro nomi Messina conserva la memoria della partecipazione femminile alla difesa durante il Vespro.",
    image: "/qa/miti-copertine/Dina_e_Clarenza_copertina_v1.png",
    imagePosition: "center center",
    imageMode: "contain-framed",
    body: [
      "Sul campanile del Duomo, ai lati del gallo, compaiono Dina e Clarenza. Le loro figure appartengono all'orologio realizzato nel 1933, ma richiamano una memoria molto più antica: la resistenza di Messina all'assedio angioino del 1282.",
      "L'assedio è un evento storico della guerra del Vespro. Nelle cronache, la difesa della città coinvolge anche le donne, impegnate a trasportare pietre e materiali per le fortificazioni. Dentro questa partecipazione collettiva prendono rilievo i nomi delle due protagoniste.",
      "Secondo il racconto tramandato, durante un attacco notturno Dina colpisce gli assalitori con un grande masso; Clarenza suona le campane per dare l'allarme e richiamare i difensori. La memoria locale colloca l'episodio alla Caperrina, il colle legato alla resistenza cittadina.",
      "La vicenda si collega alla cronaca di Bartolomeo di Neocastro e alla successiva elaborazione della memoria del Vespro. Il suo valore richiede di tenere insieme i due piani: il contesto storico dell'assedio e il racconto delle eroine, i cui particolari non possono essere tutti trattati come fatti accertati.",
      "Nel campanile questa memoria riceve una forma moderna. Il gesto dell'allarme diventa parte del suono che accompagna la città, mentre i due nomi continuano a rappresentare una difesa condivisa.",
      "Dina e Clarenza permettono così di guardare Messina dalla parte di chi ne sostenne le mura. Il loro racconto conserva soprattutto questa immagine: una comunità che resiste anche attraverso il lavoro e l'iniziativa delle donne."
    ]
  },
  {
    slug: "truvatura-via-cardines",
    title: "La truvatura di via Cardines",
    storyType: "Leggenda popolare di tesoro nascosto",
    excerpt: "Un'iscrizione difficile da leggere può diventare, nel racconto popolare, la soglia di un tesoro. In via Cardines la chiave della ricchezza era una prova singolare: decifrare la pietra mentre un cavallo correva.",
    image: "/qa/miti-copertine/Cardines_copertina_v2.png",
    imagePosition: "center 25%",
    body: [
      "Il nome di via Cardines conserva anche una piccola storia di ricchezza nascosta. Giuseppe Pitrè la pubblica nel 1904, nella sua raccolta di leggende siciliane, ambientandola espressamente a Messina.",
      "Al centro c'è un'antica iscrizione. Il popolo, riferisce il raccoglitore, la crede opera di un mago: una scrittura in una lingua sconosciuta, che sembra impossibile decifrare.",
      "La leggenda stabilisce però una condizione. Chi attraversa la strada su un cavallo lanciato a gran corsa, portando un berretto rosso, deve riuscire a leggere l'iscrizione senza fermare l'animale. Soltanto allora potrà ottenere la trovatura nascosta sotto di essa.",
      "Pitrè non racconta che qualcuno abbia superato la prova. Il suo testo lascia il tesoro sospeso dietro una combinazione di velocità, lettura e colore: la promessa resta vicina agli occhi di tutti e insieme difficile da raggiungere.",
      "È questo il nucleo della truvatura di via Cardines. Una pietra e segni non compresi diventano il centro di una storia attraverso cui la città dà un significato fantastico a una presenza antica.",
      "La raccolta documenta la leggenda, non l'esistenza dell'oro o dei poteri attribuiti all'iscrizione. Rileggerla oggi permette soprattutto di incontrare una Messina quotidiana, capace di fermarsi davanti a una scritta e immaginare che, dietro ciò che non sa leggere, si nasconda ancora qualcosa."
    ]
  }
];
