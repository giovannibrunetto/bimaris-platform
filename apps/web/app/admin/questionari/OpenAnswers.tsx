"use client";

import { useActionState, useState } from "react";

export type IdeasPage = {
  total: number;
  page: number;
  page_size: number;
  items: { date: string; text: string }[];
};

export type SearchResult = {
  ideas: IdeasPage | null;
  page: number;
  search: string;
};

type Props = {
  initialIdeas: IdeasPage | null;
  initialPage: number;
  searchAction: (state: SearchResult, form: FormData) => Promise<SearchResult>;
};

export default function OpenAnswers({ initialIdeas, initialPage, searchAction }: Props) {
  const [{ ideas, page, search }, submit, pending] = useActionState(searchAction, {
    ideas: initialIdeas,
    page: initialPage,
    search: "",
  });
  const [draft, setDraft] = useState("");
  const pages = ideas ? Math.max(1, Math.ceil(ideas.total / ideas.page_size)) : 1;

  return <>
    <form className="survey-admin__search" action={submit}>
      <label htmlFor="survey-answer-search">Cerca nelle risposte aperte</label>
      <div>
        <input id="survey-answer-search" type="search" name="q" maxLength={80}
          value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Parola o frase" />
        <button type="submit" disabled={pending}>Cerca</button>
      </div>
    </form>
    <div aria-busy={pending}>
      {!ideas ? <p className="survey-admin__notice" role="alert">
        Le risposte aperte non sono temporaneamente disponibili.
      </p> : <>
        <p className="survey-admin__caption" aria-live="polite">
          {ideas.total.toLocaleString("it-IT")} risposte · pagina {page} di {pages}
        </p>
        {ideas.items.length === 0 ? <p>Nessuna risposta aperta disponibile.</p> :
          <ul>{ideas.items.map((item, index) => <li key={index}>
            <span>{item.date}</span><p>{item.text}</p>
          </li>)}</ul>}
        {pages > 1 && <nav aria-label="Paginazione risposte aperte">
          <form className="survey-admin__paging" action={submit}>
            <input type="hidden" name="q" value={search} />
            {page > 1 && <button type="submit" name="page" value={page - 1} disabled={pending}>← Precedente</button>}
            {page < pages && <button type="submit" name="page" value={page + 1} disabled={pending}>Successiva →</button>}
          </form>
        </nav>}
      </>}
    </div>
  </>;
}
