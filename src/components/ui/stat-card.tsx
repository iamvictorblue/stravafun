import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, type CSSProperties } from 'react';

type StatCardProps = {
  label: string;
  value: number;
  formatter?: (value: number) => string;
  accent: string;
  subtitle?: string;
};

const defaultFormatter = (value: number) => value.toLocaleString();

export const StatCard = ({ label, value, formatter = defaultFormatter, accent, subtitle }: StatCardProps) => {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => formatter(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => controls.stop();
  }, [formatter, motionValue, value]);

  return (
    <motion.article
      className="stat-card"
      style={
        {
          '--accent': accent,
        } as CSSProperties
      }
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.25 }}
    >
      <p className="stat-card__label">{label}</p>
      <motion.p className="stat-card__value">{display}</motion.p>
      {subtitle ? <p className="stat-card__subtitle">{subtitle}</p> : null}
    </motion.article>
  );
};
