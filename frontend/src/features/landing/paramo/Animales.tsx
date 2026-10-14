import { motion } from 'motion/react';

/**
 * Fauna del páramo de Chingaza en estilo plano. Cada animal tiene su propio
 * ciclo de movimiento; con `animar = false` quedan quietos (movimiento
 * reducido o animación pausada).
 */
interface Props {
  animar: boolean;
}

const repetir = (duracion: number, retraso = 0) => ({ duration: duracion, repeat: Infinity, ease: 'easeInOut' as const, delay: retraso });

/** Venado de cola blanca: camina por la loma, se detiene y baja la cabeza a comer. */
export function Venado({ animar }: Props) {
  return (
    <motion.g animate={animar ? { x: [0, 110, 110, 0, 0], scaleX: [1, 1, -1, -1, 1] } : undefined} transition={{ ...repetir(22), times: [0, 0.4, 0.45, 0.9, 1] }} style={{ originX: 0.5 }}>
      <g transform="translate(650 618) scale(1.25)">
        {/* patas */}
        {[-20, -12, 14, 22].map((x, i) => (
          <motion.path
            key={x}
            d={`M${x} -18 L${x + (i % 2 ? 2 : -2)} 4`}
            stroke="#6e5238"
            strokeWidth="4"
            strokeLinecap="round"
            animate={animar ? { rotate: i % 2 ? [-10, 10, -10] : [10, -10, 10] } : undefined}
            transition={repetir(0.9)}
            style={{ originX: 0.5, originY: 0 }}
          />
        ))}
        <ellipse cx="0" cy="-26" rx="30" ry="14" fill="#9a7550" />
        <ellipse cx="-4" cy="-20" rx="20" ry="6" fill="#b58e66" />
        <path d="M-30 -30 Q -38 -34 -36 -26 Z" fill="#f3eee2" />
        <motion.g animate={animar ? { rotate: [0, 0, 32, 32, 0] } : undefined} transition={{ ...repetir(9), times: [0, 0.5, 0.6, 0.85, 1] }} style={{ originX: 0, originY: 1 }}>
          <path d="M22 -34 L32 -54 L40 -52 L32 -32 Z" fill="#9a7550" />
          <ellipse cx="40" cy="-55" rx="9" ry="6" fill="#9a7550" />
          <circle cx="42" cy="-57" r="1.6" fill="#1b1f1c" />
          <path d="M34 -60 L28 -70 M38 -61 L40 -72 M28 -70 L24 -74 M40 -72 L44 -76" stroke="#6e5238" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </g>
    </motion.g>
  );
}

/** Oso andino (de anteojos): se asoma entre los arbustos y vuelve a ocultarse. */
export function OsoAndino({ animar }: Props) {
  return (
    <g>
      <motion.g animate={animar ? { x: [90, 0, 0, 90, 90] } : { x: 10 }} transition={{ ...repetir(14, 2), times: [0, 0.18, 0.62, 0.8, 1] }}>
        <g transform="translate(1030 646) scale(1.2)">
          <ellipse cx="18" cy="-20" rx="36" ry="24" fill="#1b1d1a" />
          <circle cx="-14" cy="-34" r="17" fill="#1b1d1a" />
          <circle cx="-22" cy="-48" r="6" fill="#1b1d1a" />
          <circle cx="-4" cy="-49" r="6" fill="#1b1d1a" />
          {/* anteojos color crema característicos */}
          <path d="M-28 -40 Q -22 -46 -16 -38 Q -12 -30 -22 -28 Q -30 -30 -28 -40 Z" fill="#e7dcbc" />
          <path d="M-6 -40 Q -2 -44 2 -38 Q 2 -32 -4 -32 Z" fill="#e7dcbc" opacity="0.8" />
          <ellipse cx="-26" cy="-30" rx="7" ry="5" fill="#d8c79c" />
          <circle cx="-30" cy="-31" r="2" fill="#1b1d1a" />
          <circle cx="-21" cy="-38" r="1.6" fill="#1b1d1a" />
        </g>
      </motion.g>
      {/* arbustos que lo esconden */}
      <g fill="#2f4d36">
        <ellipse cx="1092" cy="632" rx="56" ry="34" />
        <ellipse cx="1138" cy="640" rx="44" ry="26" fill="#3c6040" />
        <ellipse cx="1060" cy="648" rx="38" ry="20" fill="#284530" />
      </g>
    </g>
  );
}

/** Cóndor andino: planea en grandes arcos. */
export function Condor({ animar }: Props) {
  return (
    <motion.g animate={animar ? { x: [0, 520, 900, 520, 0], y: [0, -40, 20, 60, 0] } : undefined} transition={repetir(34)}>
      <g transform="translate(260 210) scale(1.2)">
        <motion.path
          d="M-58 0 Q -30 -16 -4 -2 L0 2 L4 -2 Q 30 -16 58 0 Q 30 -6 6 6 L0 10 L-6 6 Q -30 -6 -58 0 Z"
          fill="#1b1f1c"
          animate={animar ? { scaleY: [1, 0.5, 1] } : undefined}
          transition={repetir(3.2)}
        />
        <path d="M-6 2 Q 0 -2 6 2" stroke="#f2f0e8" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </motion.g>
  );
}

/** Colibrí: visita las flores de los frailejones del primer plano. */
export function Colibri({ animar }: Props) {
  return (
    <motion.g
      animate={animar ? { x: [0, 0, 1080, 1080, 1180, 1180, 0], y: [0, 0, -30, -30, 40, 40, 0] } : undefined}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', times: [0, 0.15, 0.35, 0.5, 0.62, 0.8, 1] }}
    >
      <motion.g animate={animar ? { y: [0, -4, 0] } : undefined} transition={repetir(0.5)}>
        <g transform="translate(206 560) scale(1.4)">
          <path d="M-14 0 L-30 -2" stroke="#1b1f1c" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="0" cy="0" rx="12" ry="6" fill="#2f7d5b" />
          <circle cx="-9" cy="-2" r="5" fill="#2f7d5b" />
          <path d="M8 0 L20 4 L18 -2 Z" fill="#1e5a41" />
          <path d="M-8 2 Q -4 6 0 4" stroke="#d9433b" strokeWidth="3" strokeLinecap="round" fill="none" />
          <motion.ellipse cx="2" cy="-8" rx="4" ry="12" fill="#9fd8c0" opacity="0.7" animate={animar ? { scaleY: [1, 0.2, 1] } : undefined} transition={{ duration: 0.08, repeat: Infinity }} />
        </g>
      </motion.g>
    </motion.g>
  );
}

/** Pato de páramo: nada lento de un lado a otro de la laguna, dejando ondas. */
export function PatoParamo({ animar }: Props) {
  return (
    <motion.g animate={animar ? { x: [0, 220, 220, 0, 0], scaleX: [1, 1, -1, -1, 1] } : undefined} transition={{ ...repetir(26), times: [0, 0.45, 0.5, 0.95, 1] }} style={{ originX: 0.5 }}>
      <g transform="translate(690 694) scale(1.3)">
        <motion.ellipse cx="0" cy="6" rx="26" ry="4" fill="none" stroke="#d7e7ea" strokeWidth="1.5" opacity="0.7" animate={animar ? { rx: [22, 34, 22], opacity: [0.7, 0.1, 0.7] } : undefined} transition={repetir(2.4)} />
        <ellipse cx="0" cy="0" rx="18" ry="8" fill="#7b5e3f" />
        <path d="M-6 -3 Q 4 -8 12 -2" stroke="#a7865e" strokeWidth="3" fill="none" />
        <circle cx="14" cy="-8" r="6" fill="#6b4f34" />
        <path d="M19 -8 L27 -6 L19 -5 Z" fill="#e3c64a" />
        <circle cx="15" cy="-9" r="1.2" fill="#1b1f1c" />
      </g>
    </motion.g>
  );
}

/** Rana de páramo: salta de vez en cuando sobre su roca. */
export function Rana({ animar }: Props) {
  return (
    <g>
      <path d="M922 750 L936 730 L976 724 L1000 750 Z" fill="#8d8f86" />
      <motion.g animate={animar ? { y: [0, 0, -26, 0, 0], x: [0, 0, 8, 14, 14] } : undefined} transition={{ ...repetir(7), times: [0, 0.7, 0.8, 0.9, 1], repeatType: 'reverse' }}>
        <g transform="translate(958 724) scale(1.3)">
          <ellipse cx="0" cy="-6" rx="10" ry="7" fill="#5f8a3c" />
          <circle cx="-5" cy="-12" r="3.2" fill="#5f8a3c" />
          <circle cx="5" cy="-12" r="3.2" fill="#5f8a3c" />
          <circle cx="-5" cy="-12.5" r="1.4" fill="#1b1f1c" />
          <circle cx="5" cy="-12.5" r="1.4" fill="#1b1f1c" />
          <path d="M-10 -2 L-15 2 M10 -2 L15 2" stroke="#4d7330" strokeWidth="3" strokeLinecap="round" />
        </g>
      </motion.g>
    </g>
  );
}
