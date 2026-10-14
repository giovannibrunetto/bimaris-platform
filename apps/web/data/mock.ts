import type { Experience } from "@/lib/types";

export const experiences: Experience[] = [
  {
    id: "exp-stretto-01",
    slug: "stretto-dal-mare",
    name: "Lo Stretto dal mare",
    excerpt: "Vivi Messina dalla prospettiva che la rende unica: il suo mare.",
    description: "Un'esperienza sullo Stretto pensata per osservare la costa, le correnti e il paesaggio tra Sicilia e Calabria.",
    territory: "messina-stretto",
    category: "mare",
    location: "Messina",
    duration: "2 ore",
    priceFrom: 45,
    operatorName: "Operatore demo BIMARIS",
    whySelected: "Racconta lo Stretto come elemento identitario di Messina, non come semplice sfondo.",
    featured: true,
  },
  {
    id: "exp-sapori-01",
    slug: "sapori-di-messina",
    name: "Sapori di Messina",
    excerpt: "Una selezione gastronomica per conoscere il territorio attraverso ciò che produce.",
    description: "Percorso dedicato a sapori, produttori e abbinamenti locali, con attenzione all'origine delle materie prime.",
    territory: "messina-stretto",
    category: "mangiare",
    location: "Centro di Messina",
    duration: "90 minuti",
    priceFrom: 30,
    operatorName: "Produttore demo BIMARIS",
    whySelected: "Unisce prodotto, racconto e provenienza territoriale in un'unica esperienza.",
    featured: true,
  },
  {
    id: "exp-nebrodi-01",
    slug: "nebrodi-autentici",
    name: "Nebrodi autentici",
    excerpt: "Natura, paesaggi e produzioni locali lontano dai percorsi più scontati.",
    description: "Un itinerario outdoor con tappe naturalistiche e gastronomiche nel territorio dei Nebrodi.",
    territory: "nebrodi",
    category: "natura",
    location: "Nebrodi",
    duration: "1 giorno",
    priceFrom: 65,
    operatorName: "Guida demo BIMARIS",
    whySelected: "Combina natura e identità locale in modo coerente con la filosofia BIMARIS.",
    featured: true,
  },
];

export const territories = [
  { slug: "messina-stretto", name: "Messina e Stretto", text: "La città, il mare e il paesaggio tra due sponde." },
  { slug: "milazzo-tirrenica", name: "Milazzo e Tirrenica", text: "Costa, borghi e produzioni della fascia tirrenica." },
  { slug: "nebrodi", name: "Nebrodi", text: "Natura, trekking, allevamenti e sapori dell'entroterra." },
  { slug: "isole-eolie", name: "Isole Eolie", text: "Arcipelago, mare, vulcani e cultura insulare." },
];

export const itineraries = [
  { title: "Messina in 4 ore", duration: "4 ore", target: "Crocieristi", stops: 5 },
  { title: "Messina in un giorno", duration: "1 giorno", target: "Visitatori", stops: 8 },
  { title: "Messina gastronomica", duration: "5 ore", target: "Food lovers", stops: 6 },
  { title: "Tra Ionio e Tirreno", duration: "1 giorno", target: "Road trip", stops: 7 },
];

export const events = [
  { date: "18 ott", title: "Degustazione territoriale", place: "Messina", category: "Sapori" },
  { date: "24 ott", title: "Passeggiata urbana BIMARIS", place: "Centro", category: "Cultura" },
  { date: "31 ott", title: "Esperienza sullo Stretto", place: "Messina", category: "Mare" },
];
