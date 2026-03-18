import type { ReactNode } from 'react';

type SectionShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const SectionShell = ({
  eyebrow,
  title,
  description,
  actions,
  children,
}: SectionShellProps) => (
  <section className="section-shell">
    <div className="section-shell__header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-shell__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-shell__actions">{actions}</div> : null}
    </div>
    {children}
  </section>
);
