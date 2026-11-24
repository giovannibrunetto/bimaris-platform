import "./search-form.css";
export default function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form action="/cerca" method="get" className="territory-search-form" role="search">
      <label className="sr-only" htmlFor="territory-query">Cerca luoghi, eventi ed esperienze</label>
      <input id="territory-query" name="q" type="search" defaultValue={query} required maxLength={180}
        placeholder="Es. passeggiata sul mare" />
      <button type="submit">Scopri Messina <span aria-hidden="true">→</span></button>
    </form>
  );
}
