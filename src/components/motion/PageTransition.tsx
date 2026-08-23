/**
 * Page entry transition.
 *
 * The one place Framer Motion genuinely earns its weight: an enter animation
 * keyed to the route, animating only `opacity` and `transform` so it stays on
 * the compositor. Everything else in the portal uses CSS transitions.
 *
 * Motion's own reduced-motion support is respected via `useReducedMotion`, so
 * the movement is dropped entirely for users who ask for that.
 */
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      key={routeKey}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
