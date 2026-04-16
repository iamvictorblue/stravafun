import { motion } from 'framer-motion';
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
  <motion.section
    className="section-shell"
    initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="section-shell__header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-shell__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-shell__actions">{actions}</div> : null}
    </div>
    {children}
  </motion.section>
);
