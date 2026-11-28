"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function ContextualReturnLink() {
  const pathname = usePathname();
  const params = useSearchParams();
  const origin = params.get("da");
  const detail = /^\/(cultura|borghi|storie-miti-leggende|operatori|esperienze|sapori-territori|appuntamenti)\/[^/]+\/?$/.test(pathname);
  const operatorWorkspace = pathname.startsWith("/area-operatore/");
  const operatorOrigin = detail && origin === "area-operatore" &&
    !(pathname.startsWith("/esperienze/") && params.has("operatore"));
  const profileOrigin = detail && origin === "profilo" &&
    !pathname.startsWith("/cultura/") && !pathname.startsWith("/operatori/") &&
    !(pathname.startsWith("/esperienze/") && params.has("operatore"));

  if (!operatorWorkspace && !operatorOrigin && !profileOrigin) return null;

  const inOperatorFlow = operatorWorkspace || operatorOrigin;
  return (
    <nav className="section" aria-label="Ritorno alla tua area" style={{ paddingBlock: "16px 24px" }}>
      <Link className="text-link" href={inOperatorFlow ? "/area-operatore" : "/profilo"}>
        {inOperatorFlow ? "← Torna all’Area Operatore" : "← Torna all’Area personale"}
      </Link>
    </nav>
  );
}
