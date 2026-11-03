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
// Staging-only source override: database records, visual assets and the seven original stories remain untouched.
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
