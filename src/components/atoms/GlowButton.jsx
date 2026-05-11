import { motion } from 'framer-motion';

export default function GlowButton({ children, onClick, variant = 'primary', size = 'md', className = '' }) {
  const colors = {
    primary:   { bg: '#00FF8820', border: '#00FF8840', text: '#00FF88', glow: 'rgba(0,255,136,0.2)' },
    secondary: { bg: '#00D4FF15', border: '#00D4FF30', text: '#00D4FF', glow: 'rgba(0,212,255,0.2)' },
    danger:    { bg: '#FF334415', border: '#FF334430', text: '#FF3344', glow: 'rgba(255,51,68,0.2)' },
    amber:     { bg: '#FFB80015', border: '#FFB80030', text: '#FFB800', glow: 'rgba(255,184,0,0.2)' },
  };
  const c = colors[variant] || colors.primary;
  const sizes = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-[11px]',
    lg: 'px-4 py-2 text-[12px]',
  };

  return (
    <motion.button
      className={`font-system font-semibold tracking-wider uppercase rounded cursor-pointer ${sizes[size]} ${className}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
      whileHover={{
        boxShadow: `0 0 20px ${c.glow}`,
        borderColor: c.text,
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
