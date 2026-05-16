import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export function Reveal({
  children,
  className = '',
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reveal}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = '',
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
