import React, { useEffect, useRef } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const stagger = (delay = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
});

/** Wraps each routed page for enter/exit transitions. */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its <MotionItem> children in. */
export function Stagger({ children, delay = 0.05, component = 'div', ...rest }) {
  const Comp = motion[component] || motion.div;
  return (
    <Comp variants={stagger(delay)} initial="hidden" animate="show" {...rest}>
      {children}
    </Comp>
  );
}

export function MotionItem({ children, component = 'div', ...rest }) {
  const Comp = motion[component] || motion.div;
  return (
    <Comp variants={fadeUp} {...rest}>
      {children}
    </Comp>
  );
}

/** Counts up to `value` when it scrolls into view. */
export function AnimatedNumber({ value, duration = 0.9, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const from = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!inView || reduce) {
      node.textContent = `${value}${suffix}`;
      return undefined;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, duration, suffix, reduce]);

  return <span ref={ref}>{`${value}${suffix}`}</span>;
}

export { motion };
