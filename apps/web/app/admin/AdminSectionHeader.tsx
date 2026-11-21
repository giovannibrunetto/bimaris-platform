import type { ReactNode } from "react";
import "./admin-section-header.css";

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
  summary?: ReactNode;
  id?: string;
};

export default function AdminSectionHeader({ title, description, actions, summary, id }: Props) {
  return (
    <header className="admin-section-heading">
      <div className="admin-section-heading__inner">
        <div className="admin-section-heading__row">
          <div className="admin-section-heading__copy">
            <h2 id={id}>{title}</h2>
            <p>{description}</p>
          </div>
          {actions && <div className="admin-section-heading__actions">{actions}</div>}
        </div>
        {summary && <div className="admin-section-heading__summary">{summary}</div>}
      </div>
    </header>
  );
}
