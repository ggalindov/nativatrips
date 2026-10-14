import { motion } from 'motion/react';

const HOJAS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * Frailín, el asistente del sitio: un frailejón pequeño con carita, mejillas
 * y una flor amarilla en la cabeza. Parpadea y, si `animado`, se mece.
 */
export function Frailin({ tamano = 48, animado = true }: { tamano?: number; animado?: boolean }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" aria-hidden="true" className="flex-none overflow-visible">
      <motion.g
        animate={animado ? { rotate: [-4, 4, -4] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '32px', originY: '58px' }}
      >
        {/* flor en la cabeza */}
        <path d="M32 14 L32 7" stroke="#8a7a52" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="32" cy="6" r="3.4" fill="#e8cf5c" />
        <circle cx="29.2" cy="8.4" r="2.3" fill="#e3c64a" />
        <circle cx="34.8" cy="8.4" r="2.3" fill="#e3c64a" />
        {/* roseta de hojas */}
        {HOJAS.map((a) => (
          <ellipse key={a} cx="32" cy="20" rx="5.2" ry="11" fill={a % 60 === 0 ? '#c9d3b6' : '#aebb98'} transform={`rotate(${a} 32 33)`} />
        ))}
        {/* cara */}
        <circle cx="32" cy="33" r="13" fill="#e9eedd" />
        <motion.g animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }} style={{ originY: '31px' }}>
          <ellipse cx="27.4" cy="31" rx="1.9" ry="2.4" fill="#13201a" />
          <ellipse cx="36.6" cy="31" rx="1.9" ry="2.4" fill="#13201a" />
          <circle cx="28" cy="30.2" r="0.7" fill="#fff" />
          <circle cx="37.2" cy="30.2" r="0.7" fill="#fff" />
        </motion.g>
        <ellipse cx="23.8" cy="35.4" rx="2.4" ry="1.5" fill="#f2a7a0" opacity="0.8" />
        <ellipse cx="40.2" cy="35.4" rx="2.4" ry="1.5" fill="#f2a7a0" opacity="0.8" />
        <path d="M28.6 36.4 Q32 39.6 35.4 36.4" stroke="#13201a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* tronco con hojas secas */}
        <path d="M29.5 45 L29 58 L35 58 L34.5 45 Z" fill="#6b5a45" />
        <path d="M29.3 49 L34.7 47.6 M29.2 53.4 L34.8 52" stroke="#8a7760" strokeWidth="1.2" />
      </motion.g>
    </svg>
  );
}
