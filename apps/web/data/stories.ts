import { createPublicClient } from "@/lib/supabase/public";

export type StoryPlace = { name: string; address?: string; googleMapsQuery: string; latitude?: number; longitude?: number; label?: string; note?: string; position: number; };
export type StorySource = { label: string; url?: string; sourceType?: string; note?: string; sortOrder: number; };
export type StoryImage = { imageUrl: string; altText?: string; caption?: string; author?: string; license?: string; sourceUrl?: string; licenseUrl?: string; sortOrder: number; isPrimary: boolean; };
export type StoryEditorialContext = { originText?: string; documentedText?: string; traditionText?: string; interpretationsText?: string; unverifiableText?: string; geographicReference?: string; periodLabel?: string; editorialNote?: string; relations: string[]; };

export type StoryEntry = {
  id: string; slug: string; title: string; excerpt: string; body: string; storyType: string;
  sourceLabel?: string; sourceUrl?: string; featured?: boolean;
  imageUrl?: string; imageAlt?: string; imageAuthor?: string; imageLicense?: string; imageSourceUrl?: string; imageLicenseUrl?: string;
  places: StoryPlace[]; sources: StorySource[]; images: StoryImage[]; editorial?: StoryEditorialContext;
};

type RawStoryPlace = { position: number | null; label: string | null; note: string | null; place: { name: string; address: string | null; google_maps_query: string | null; latitude: number | string | null; longitude: number | string | null; } | null; };
type RawStorySource = { label: string; url: string | null; source_type: string | null; note: string | null; sort_order: number | null; };
type RawStoryImage = { image_url: string; alt_text: string | null; caption: string | null; author: string | null; license: string | null; source_url: string | null; license_url: string | null; sort_order: number | null; is_primary: boolean | null; };
type RawEditorial = { origin_text: string | null; documented_text: string | null; tradition_text: string | null; interpretations_text: string | null; unverifiable_text: string | null; geographic_reference: string | null; period_label: string | null; editorial_note: string | null; relations: string[] | null; };
type RawStory = { id: string; slug: string; title: string; excerpt: string | null; body: string | null; story_type: string | null; source_label: string | null; source_url: string | null; featured: boolean | null; image_url: string | null; image_alt: string | null; image_author: string | null; image_license: string | null; image_source_url: string | null; image_license_url: string | null; story_places: RawStoryPlace[] | null; sources: RawStorySource[] | null; images: RawStoryImage[] | null; editorial: RawEditorial | RawEditorial[] | null; };

type StoryTextOverride = Pick<StoryEntry, "title" | "excerpt" | "body">;

// Editorial freeze v3.0 approved by Direzione Strategica on 2026-11-03.
// Staging-only source override: database records and visual assets remain untouched.
const approvedStoryTextV3: Record<string, StoryTextOverride> = {
  orione: {
    title: "Orione e le origini mitiche di Messina",
    excerpt: "Il gigante che diede forma all’approdo",
    body: `Prima di diventare una figura di marmo in piazza Duomo, Orione fu il protagonista di un’impresa grande quanto il porto di Messina.

Il mito tramandato da Diodoro Siculo lo descrive più alto e più forte degli altri eroi. Era un cacciatore, ma la sua forza serviva anche a costruire: le opere che compiva gli procuravano gloria quanto le imprese di caccia.

A Zancle, l’antica Messina, regnava Zanclo. Per lui Orione realizzò un argine e formò il porto. Il racconto affidava così a un gigante ciò che caratterizzava la città: una costa capace di racchiudere il mare e diventare approdo.

Le sue opere proseguivano al Peloro, sulla punta nordorientale della Sicilia. Qui, nella tradizione che Diodoro riferisce a Esiodo, Orione ampliò il promontorio e innalzò un santuario a Poseidone, dio del mare. Compiute queste imprese, lasciò la Sicilia per l’Eubea. La sua fama lo portò infine fra le stelle.

Il gigante era partito; il racconto delle sue opere rimaneva legato alla costa messinese.

Molti secoli dopo, la città gli diede un posto anche nella propria piazza principale. Davanti al Duomo, la Fontana di Orione di Giovanni Angelo Montorsoli, ultimata nel 1553, riprese l’antico eroe per celebrare l’acqua dell’acquedotto. Fra i fiumi rappresentati compare il Camaro, insieme a Nilo, Tevere ed Ebro.

Se ti fermi davanti alla fontana, cerca Orione nella parte più alta del monumento. Quel personaggio appartiene al mito; il marmo che lo raffigura racconta invece una scelta della Messina del Cinquecento. Il costruttore dell’approdo tornava al centro della città, in un’opera dedicata a un’altra acqua essenziale alla sua vita.`,
  },
  "crono-e-la-falce": {
    title: "Crono e la falce del porto",
    excerpt: "L’arma degli dèi sotto Zancle",
    body: `Prima che la falce diventasse un nome della costa messinese, nel mito era stata un’arma.

Urano, il Cielo, teneva nascosti i propri figli nelle profondità di Gea, la Terra. Gea preparò una falce e cercò fra loro chi osasse opporsi al padre. Crono accettò. Nascosto in agguato, attese Urano e lo evirò con la lama ricevuta dalla madre: così Esiodo racconta la ribellione del figlio contro il padre.

La storia della falce riappare in Sicilia, in un altro poema antico, gli Aitia di Callimaco. Qui l’arma è nascosta sotto terra a Zancle. Attorno ad essa, i fondatori innalzano una difesa di legno.

A guidare i coloni venuti da Cuma e Calcide sono Periere e Cratemene. Costruita la città, i due entrano in contrasto e si rivolgono ad Apollo per sapere a chi debba appartenere la nuova colonia. La risposta non assegna a nessuno dei due il nome di fondatore.

Il racconto si chiude con una conseguenza singolare: quando la comunità invita il proprio fondatore al sacrificio, non lo chiama per nome. L’invito è rivolto a chiunque abbia costruito la città. La contesa dei due uomini lascia così, nella tradizione poetica, una memoria senza un unico nome da celebrare.

La falce resta sotto Zancle. Non sappiamo da questo testo come vi sia arrivata; sappiamo che Callimaco la colloca proprio qui, sotto l’insediamento.

Per incontrare oggi questa leggenda, il luogo da guardare è il porto. La sua curva richiama una lama ricurva: già Tucidide riferiva che i Siculi avevano chiamato la città Zancle proprio per quella forma.

Il paesaggio e il poema offrono due immagini della stessa falce: una disegnata dalla costa, l’altra nascosta sotto la città del racconto. Guardando l’approdo, puoi riconoscere la prima e seguire con l’immaginazione la seconda, fino al tempo degli dèi e alla disputa degli uomini che fondavano una città.`,
  },
  "dina-e-clarenza": {
    title: "Dina e Clarenza",
    excerpt: "Due donne nella difesa di Messina",
    body: `Nel 1282 Messina è assediata dalle forze di Carlo d’Angiò. La rivolta del Vespro è diventata guerra, e la resistenza della città richiede anche il lavoro di chi porta pietre e calcina per rafforzarne le difese. Fra queste persone, le testimonianze sulla memoria del Vespro danno particolare rilievo alle donne.

È dentro questa resistenza che la tradizione colloca Dina e Clarenza.

Il racconto le lega alla Caperrina, il colle che sovrasta il centro cittadino. Durante un attacco notturno, mentre gli assalitori cercano di avanzare, Dina interviene con un grande masso. Clarenza dà l’allarme suonando le campane, richiamando i difensori.

I loro gesti si completano: una contrasta l’attacco, l’altra lo rende noto alla città. Nella vicenda tramandata la difesa passa anche attraverso queste due iniziative femminili, accanto all’impegno collettivo di chi sostiene le fortificazioni.

L’assedio appartiene alla storia; l’episodio delle due donne ci arriva attraverso una memoria eroica, che non consente di accertarne ogni particolare. Ma i due nomi hanno continuato a rappresentare la partecipazione delle donne alla resistenza messinese.

Per ritrovarli nella città, fermati in piazza Duomo e alza lo sguardo verso il campanile. Ai lati del gallo compaiono Dina e Clarenza: sono le figure dell’orologio realizzato nel 1933. Entrambe sono rappresentate nell’atto di azionare le campane.

Non stai guardando un’opera rimasta dall’assedio. Stai guardando il modo in cui, secoli dopo, Messina ha scelto di ricordarlo. Le protagoniste della difesa sono entrate nel monumento che scandisce il tempo cittadino: dal racconto di una notte d’allarme alla memoria pubblica custodita nella piazza.`,
  },
  "truvatura-via-cardines": {
    title: "La truvatura di via Cardines",
    excerpt: "Il tesoro che si poteva raggiungere soltanto leggendo",
    body: `In via Cardines, a Messina, c’era un’antica iscrizione che la voce popolare attribuiva a un mago. I suoi segni erano in una lingua sconosciuta: nessuno sapeva decifrarli. Sotto quell’iscrizione, diceva la leggenda, era nascosta una truvatura, un tesoro.

Per ottenerlo non bastava scavare. Bisognava attraversare la strada a cavallo, a gran corsa, portando un berretto rosso. E durante il passaggio bisognava leggere l’iscrizione, senza che il cavallo si fermasse.

La promessa dipendeva tutta da quella prova. Ciò che non si riusciva a leggere da fermi doveva essere decifrato mentre si correva; il tempo per farlo era quello del passaggio davanti alla pietra.

Qui si arresta la leggenda raccolta da Giuseppe Pitrè e pubblicata nel 1904. Non compare un cavaliere che tenti l’impresa, né qualcuno che porti alla luce il tesoro. Rimangono la scrittura sconosciuta e la condizione per raggiungere ciò che nasconderebbe.

Via Cardines è il luogo al quale il racconto appartiene. Percorrendola oggi, puoi riportare la leggenda alla strada di cui conserva il nome; non possiamo però indicarti una pietra sulla quale tentare di leggere quegli stessi segni. La fonte ci consegna una promessa di ricchezza nascosta, non una mappa per ritrovarla.`,
  },
  "fata-morgana-stretto": {
    title: "La Fata Morgana dello Stretto",
    excerpt: "L’isola che sembrava a portata di mano",
    body: `Il conquistatore era arrivato fino alla riva calabrese. Davanti a lui c’era la Sicilia; per raggiungerla mancava una barca.

Comincia così una leggenda dello Stretto: un re senza nome, giunto dal continente, si trova fermato dal mare. Dall’altra parte vede la terra che vorrebbe conquistare, ma non può passarvi.

Gli appare una donna. Con un incantesimo gli mostra la Sicilia vicinissima: distingue le campagne e il porto di Messina, le navi e chi lavora ai carichi. La distanza sembra scomparsa. Il re lascia il cavallo e si getta in acqua, convinto di poter raggiungere l’isola a nuoto.

Ma l’immagine si dissolve. Il mare che lo separa dalla Sicilia è ancora lì, e il conquistatore annega. La donna che gli aveva mostrato quella terra era Morgana: la sua offerta era stata un inganno.

Questa è una delle storie nate attorno alla Fata Morgana. Il suo teatro è il tratto d’acqua fra Reggio e Messina: per seguirla, guarda la città siciliana dalla sponda calabrese e considera lo spazio che la separa da chi la osserva.

Il miraggio che porta quel nome esiste davvero. Strati d’aria con temperature e densità differenti deviano la luce e possono deformare o spostare le immagini della costa. La leggenda affida invece a una fata il potere di avvicinare l’isola.

Le due cose si incontrano nello sguardo di chi rimane sulla riva. La Sicilia sembra raggiungibile in pochi passi, ma fra le sponde continua a scorrere lo Stretto.`,
  },
  colapesce: {
    title: "Colapesce: il giovane che regge la Sicilia",
    excerpt: "L’immersione dalla quale non tornò",
    body: `A Messina chiamavano Nicola «Colapesce», perché in mare sapeva fare ciò che agli altri sembrava impossibile. Si immergeva tanto a lungo che la sua fama arrivò al re di Sicilia.

Il sovrano volle metterlo alla prova. Nello Stretto gettò una coppa preziosa e gli ordinò di recuperarla. Nicola scese e tornò con l’oggetto. Il re ripeté la prova in acque più profonde; anche questa volta il giovane risalì.

Poi la coppa venne lanciata ancora più giù. Colapesce si immerse per la terza volta e scomparve.

La versione messinese che racconta il suo sacrificio prosegue sotto la superficie: laggiù il giovane vide le tre colonne sulle quali poggiava la Sicilia. Quella sotto Messina stava cedendo. Colapesce rimase a sostenerla con il proprio corpo, impedendo che l’isola sprofondasse.

Per chi era sopra, l’ultima immersione si era conclusa con un’assenza. Per il racconto, invece, Nicola non aveva smesso di agire: continuava a reggere la terra sotto Capo Peloro.

Guardando il mare da Torre Faro, ti trovi davanti al paesaggio al quale questa versione della leggenda lega la sua discesa. Non c’è un punto degli abissi da indicare come luogo del ritrovamento: la colonna appartiene al racconto.

La città ha però dato una forma visibile a quella storia. Nel Teatro Vittorio Emanuele, Renato Guttuso ha rappresentato Colapesce sul soffitto della sala. Il giovane delle profondità torna così sopra gli spettatori: il teatro conserva nell’immagine ciò che la leggenda lascia per sempre sotto il mare.`,
  },
  "scilla-e-cariddi": {
    title: "Scilla e Cariddi: i mostri dello Stretto",
    excerpt: "Il passaggio di Ulisse",
    body: `Prima di riprendere il viaggio, Ulisse aveva ricevuto da Circe un avvertimento: avrebbe incontrato due pericoli, e avvicinarsi all’uno significava allontanarsi dall’altro.

Da una parte abitava Scilla, nascosta in una caverna, con sei teste pronte ad afferrare chi passava. Dall’altra Cariddi inghiottiva il mare e lo rigettava. Finire nel suo gorgo avrebbe significato perdere la nave intera. Circe gli aveva consigliato di tenersi dalla parte di Scilla.

Quando il passaggio apparve davanti ai naviganti, il fragore dell’acqua fece cadere i remi dalle mani dei compagni. Ulisse li richiamò ai loro posti e ordinò al timoniere di accostarsi alla rupe. Non disse loro quale minaccia vi si nascondesse.

Mentre tutti guardavano Cariddi, Scilla afferrò sei uomini dalla nave. Ulisse non riuscì a salvarli. L’imbarcazione superò il passaggio, ma lo fece lasciando quei compagni al mostro.

L’episodio dell’Odissea si conclude così: una nave prosegue, sei uomini non tornano. L’avvertimento di Circe non aveva promesso una traversata senza perdite.

La tradizione ha riconosciuto questo paesaggio mitico nello Stretto di Messina, collocando Scilla sul lato calabrese e Cariddi su quello siciliano. Da Capo Peloro puoi guardare verso la costa opposta e ritrovare la relazione fra le due rive che ha dato una geografia al racconto.

Il mare che attraversi con gli occhi non custodisce due creature da localizzare: custodisce il paesaggio al quale generazioni di lettori e naviganti hanno legato la scelta di Ulisse, costretto a cercare un’uscita fra due minacce.`,
  },
  "mata-e-grifone": {
    title: "Mata e Grifone, i Giganti di Messina",
    excerpt: "Il gigante che dovette cambiare",
    body: `A Camaro viveva Mata. Nella leggenda, un guerriero moro di dimensioni gigantesche, venuto a saccheggiare il territorio messinese, la vide e volle sposarla.

La famiglia si oppose e nascose la giovane. Gli uomini del guerriero scoprirono il rifugio, la rapirono e la portarono al loro capo. Ma avere Mata accanto non significava averne ottenuto il consenso: la ragazza non accettava quell’unione.

Il racconto cambia direzione quando il guerriero si converte al cristianesimo e assume il nome di Grifone. Nella variante che prosegue fino al matrimonio, Mata diventa sua sposa; la tradizione non chiarisce come si passi dal precedente rifiuto alle nozze. Nella memoria cittadina i due diventano i progenitori simbolici dei messinesi.

È questa una delle vicende attribuite ai Giganti, non la biografia accertata di due fondatori. La storia del rapimento resta parte della variante: non scompare dietro il lieto fine delle nozze.

Quando incontri Mata e Grifone nelle celebrazioni di agosto, riconosci entrambi a cavallo, innalzati ben oltre l’altezza di chi li accompagna. La leggenda dà nomi e vicende a quelle figure; la loro presenza nella festa ha una storia documentata propria.

Un pagamento del 1548 ricorda guanti per la Gigantessa e uno stendardo per il Gigante. L’assetto equestre è attestato dal 1723. Non sono date della vita della coppia: sono tracce della costruzione e della trasformazione delle figure festive.

Camaro resta il luogo che lega Mata al territorio, e la passeggiata riporta i due personaggi nelle strade cittadine. Messina continua a incontrarli insieme, conservando in una festa la coppia alla quale ha affidato uno dei racconti della propria origine.`,
  },
  "madonna-della-lettera": {
    title: "La Madonna della Lettera e la promessa a Messina",
    excerpt: "Il viaggio degli ambasciatori",
    body: `Il viaggio comincia a Messina, dopo la predicazione di Paolo. Secondo la tradizione devozionale, alcuni cittadini, convertiti al cristianesimo, desiderano incontrare Maria, la madre di Gesù, e chiedere la sua protezione per la città.

Gli ambasciatori partono per Gerusalemme. Il racconto li colloca nell’anno 42: Maria è ancora in vita e li accoglie. Alla richiesta risponde con una lettera destinata ai messinesi, nella quale benedice loro e la città.

La tradizione data il messaggio al 3 giugno e lo accompagna a una ciocca dei capelli della Vergine. Gli inviati riportano a Messina il segno di quella promessa. Il viaggio nato da una richiesta si conclude con una benedizione da consegnare a tutta la comunità.

Da questo racconto viene il titolo di Madonna della Lettera. La devozione ha legato la promessa a luoghi e immagini che puoi incontrare ancora oggi: il Duomo, centro del culto cittadino, e le rappresentazioni dell’ambasceria conservate nel patrimonio artistico messinese.

Il Museo regionale Accascina ne custodisce testimonianze particolari: dipinti dedicati all’incontro con Maria e persino una versione cinese del testo della lettera, eseguita nel Seicento su tessuto di lino. Sono opere e documenti della diffusione del culto, non testimonianze contemporanee al viaggio narrato.

L’ambasceria appartiene alla tradizione religiosa; la devozione che ne è cresciuta appartiene anche alla storia della città. Nella festa del 3 giugno Messina rinnova quel rapporto: il messaggio affidato a pochi ambasciatori viene ricordato come una promessa rivolta a tutti.`,
  },
  "leggende-madonna-dinnammare": {
    title: "Le due leggende della Madonna di Dinnammare",
    excerpt: "L’immagine che tornava sul monte",
    body: `Un pastore di Larderia trovò sul monte una tavoletta di marmo con l’immagine di Maria e la portò a casa. La mattina seguente era scomparsa. Cercandola, la ritrovò sulla montagna, nello stesso punto.

Il parroco volle custodirla nella chiesa di Larderia. Ma anche da lì l’immagine scomparve e tornò sul monte. Il ritorno indicava, secondo la leggenda, il luogo al quale era destinata: vi sarebbe stata costruita una chiesa.

L’immagine arrivata dal mare

Un’altra leggenda comincia sulla costa. Due creature marine trasportarono l’immagine sacra fino alla spiaggia di Maregrosso. I pescatori iniziarono a venerarla; poi la portarono sul monte Dinnammare, dove sarebbe sorto il luogo di culto.

Sono due racconti diversi: nel primo l’immagine torna da sola alla montagna; nel secondo sono i pescatori a condurvela dal mare.

Nel santuario, il rilievo marmoreo ottocentesco raffigura la Madonna col Bambino sostenuta da due creature marine: una testimonianza della devozione, non una prova del miracolo.

Larderia, Maregrosso e la vetta appartengono a due itinerari della tradizione. Nel santuario entrambi trovano il loro punto di arrivo.`,
  },
  "risa-citta-sommersa-ganzirri": {
    title: "Risa, la città sommersa di Ganzirri",
    excerpt: "La campana sotto il lago",
    body: `Prima del lago, dice la leggenda, c’era Risa.

Dove oggi si distende il Lago Grande di Ganzirri sorgeva una città dalle mura chiare. Un terremoto la distrusse e fece sprofondare il terreno. Nella voragine si raccolsero le acque, e il luogo delle case diventò un lago.

Il racconto avrebbe potuto finire con la scomparsa della città. Continua invece con qualcosa che, secondo la credenza, non ha smesso di farsi sentire: la campana della sua chiesa.

La torre era stata abbattuta dal sisma, ma la campana sommersa avrebbe continuato a suonare all’arrivo delle burrasche. I rintocchi avvertivano i pescatori di non mettersi in mare. La città scomparsa restava così legata alla vita di chi abitava sulle rive.

La raccolta locale che tramanda questa versione attribuisce il racconto ai pescatori e agli anziani di Ganzirri. Non ci consegna un superstite con un nome, né la cronaca di un giorno preciso: ci consegna la città inghiottita e il suono che la richiamerebbe alla memoria.

Per ritrovare il luogo della leggenda, fermati davanti al Lago Grande. È qui che il racconto colloca Risa, non nel vicino Lago Piccolo. Non ci sono rovine verificate della città da indicarti sul fondo. Lo specchio d’acqua è un paesaggio reale, la città sommersa è la presenza che la tradizione vi immagina.

In questa storia la fine di Risa non interrompe ogni rapporto con la riva: la campana continua a rivolgersi a chi sta per uscire, trasformando il ricordo di una catastrofe in un avvertimento.`,
  },
};

function mapStory(row: RawStory): StoryEntry {
  const places = (row.story_places ?? []).filter(item => item.place).map(item => {
    const latitude = item.place?.latitude == null ? undefined : Number(item.place.latitude);
    const longitude = item.place?.longitude == null ? undefined : Number(item.place.longitude);
    return { name: item.place!.name, address: item.place!.address ?? undefined, googleMapsQuery: item.place!.google_maps_query ?? item.place!.name, latitude: Number.isFinite(latitude) ? latitude : undefined, longitude: Number.isFinite(longitude) ? longitude : undefined, label: item.label ?? undefined, note: item.note ?? undefined, position: item.position ?? 1 } satisfies StoryPlace;
  }).sort((a,b) => a.position - b.position);

  const sources = (row.sources ?? []).map(item => ({ label: item.label, url: item.url ?? undefined, sourceType: item.source_type ?? undefined, note: item.note ?? undefined, sortOrder: item.sort_order ?? 1 })).sort((a,b) => a.sortOrder - b.sortOrder);
  const images = (row.images ?? []).map(item => ({ imageUrl: item.image_url, altText: item.alt_text ?? undefined, caption: item.caption ?? undefined, author: item.author ?? undefined, license: item.license ?? undefined, sourceUrl: item.source_url ?? undefined, licenseUrl: item.license_url ?? undefined, sortOrder: item.sort_order ?? 1, isPrimary: item.is_primary ?? false })).sort((a,b) => a.sortOrder - b.sortOrder);
  const primaryImage = images.find(image => image.isPrimary) ?? images[0];
  const rawEditorial = Array.isArray(row.editorial) ? row.editorial[0] : row.editorial;
  const editorial = rawEditorial ? { originText: rawEditorial.origin_text ?? undefined, documentedText: rawEditorial.documented_text ?? undefined, traditionText: rawEditorial.tradition_text ?? undefined, interpretationsText: rawEditorial.interpretations_text ?? undefined, unverifiableText: rawEditorial.unverifiable_text ?? undefined, geographicReference: rawEditorial.geographic_reference ?? undefined, periodLabel: rawEditorial.period_label ?? undefined, editorialNote: rawEditorial.editorial_note ?? undefined, relations: rawEditorial.relations ?? [] } : undefined;
  const approvedText = approvedStoryTextV3[row.slug];

  return { id: row.id, slug: row.slug, title: approvedText?.title ?? row.title, excerpt: approvedText?.excerpt ?? row.excerpt ?? "Una storia legata al territorio messinese.", body: approvedText?.body ?? row.body ?? row.excerpt ?? "Una storia legata al territorio messinese.", storyType: row.story_type ?? "leggenda", sourceLabel: sources[0]?.label ?? row.source_label ?? undefined, sourceUrl: sources[0]?.url ?? row.source_url ?? undefined, featured: row.featured ?? false, imageUrl: primaryImage?.imageUrl ?? row.image_url ?? undefined, imageAlt: primaryImage?.altText ?? row.image_alt ?? undefined, imageAuthor: primaryImage?.author ?? row.image_author ?? undefined, imageLicense: primaryImage?.license ?? row.image_license ?? undefined, imageSourceUrl: primaryImage?.sourceUrl ?? row.image_source_url ?? undefined, imageLicenseUrl: primaryImage?.licenseUrl ?? row.image_license_url ?? undefined, places, sources, images, editorial };
}

const storySelect = "id,slug,title,excerpt,body,story_type,source_label,source_url,featured,image_url,image_alt,image_author,image_license,image_source_url,image_license_url,story_places(position,label,note,place:places(name,address,google_maps_query,latitude,longitude)),sources:story_sources(label,url,source_type,note,sort_order),images:story_images(image_url,alt_text,caption,author,license,source_url,license_url,sort_order,is_primary),editorial:story_editorial_context(origin_text,documented_text,tradition_text,interpretations_text,unverifiable_text,geographic_reference,period_label,editorial_note,relations)";

export async function getPublishedStories(): Promise<StoryEntry[]> { const client = createPublicClient(); if (!client) return []; const { data, error } = await client.from("stories").select(storySelect).eq("published", true).order("featured", { ascending: false }).order("title"); if (error) { console.error("BIMARIS stories read failed", error.message); return []; } return (data as unknown as RawStory[]).map(mapStory); }
export async function getPublishedStoryBySlug(slug: string): Promise<StoryEntry | null> { const client = createPublicClient(); if (!client) return null; const { data, error } = await client.from("stories").select(storySelect).eq("published", true).eq("slug", slug).maybeSingle(); if (error) { console.error("BIMARIS story detail read failed", error.message); return null; } return data ? mapStory(data as unknown as RawStory) : null; }