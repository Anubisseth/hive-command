// ═══════════════════════════════════════════════════
// HIVE COMMAND — Motion Design System
// All animation variants & timing constants
// ═══════════════════════════════════════════════════

export const MOTION = {
  duration: {
    instant:  0.1,
    fast:     0.2,
    normal:   0.3,
    slow:     0.5,
    dramatic: 0.8,
    ambient:  2.0,
  },
  ease: {
    snappy:     [0.25, 0.46, 0.45, 0.94],
    smooth:     [0.43, 0.13, 0.23, 0.96],
    bounce:     [0.68, -0.55, 0.265, 1.55],
    sharp:      [0.4, 0, 0.2, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
  },
  spring: {
    gentle: { type: "spring", stiffness: 120, damping: 14 },
    snappy: { type: "spring", stiffness: 300, damping: 30 },
    bouncy: { type: "spring", stiffness: 400, damping: 20 },
    stiff:  { type: "spring", stiffness: 500, damping: 35 },
  },
};

// Page load — staggered reveal
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: MOTION.ease.smooth },
  },
};

// Agent card hover & press
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 0 2px rgba(255, 150, 30, 0.2), inset 0 1px 0 rgba(255, 180, 60, 0.08), 0 6px 28px rgba(0, 0, 0, 0.65)",
    borderColor: "rgba(255, 150, 30, 0.3)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 0 8px rgba(255, 150, 30, 0.3), 0 0 35px rgba(255, 150, 30, 0.12), inset 0 1px 0 rgba(255, 180, 60, 0.12), 0 10px 40px rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 150, 30, 0.55)",
    transition: { duration: 0.25, ease: MOTION.ease.snappy },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: { duration: 0.1 },
  },
};

// Detail panel slide-in
export const detailPanel = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      ...MOTION.spring.snappy,
      staggerChildren: 0.05,
      delayChildren: 0.15,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.25, ease: MOTION.ease.accelerate },
  },
};

export const sectionVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: MOTION.ease.smooth },
  },
};

// Task feed items
export const taskEnter = {
  initial: { opacity: 0, x: -40, height: 0 },
  animate: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { ...MOTION.spring.bouncy },
  },
  exit: {
    opacity: 0,
    x: 40,
    height: 0,
    transition: { duration: 0.2 },
  },
};

// Modal
export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION.spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// Tab content crossfade
export const tabContent = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

// Commander Loop — executing agent pulse
export const loopPulse = {
  idle: { boxShadow: '0 0 0px rgba(0,255,136,0)' },
  active: {
    boxShadow: [
      '0 0 4px rgba(0,255,136,0.2)',
      '0 0 16px rgba(0,255,136,0.4)',
      '0 0 4px rgba(0,255,136,0.2)',
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// Commander Loop — phase step transition
export const phaseStep = {
  inactive: { opacity: 0.25, scale: 0.95 },
  active: {
    opacity: 1,
    scale: 1.05,
    transition: { duration: 0.3, ease: MOTION.ease.snappy },
  },
  complete: {
    opacity: 0.6,
    scale: 1,
    transition: { duration: 0.2 },
  },
};

// Toast notification
export const toast = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { ...MOTION.spring.bouncy },
  },
  exit: {
    opacity: 0, y: -20, scale: 0.95,
    transition: { duration: 0.2 },
  },
};
