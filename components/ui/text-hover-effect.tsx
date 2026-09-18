'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

// Brand text with an ember stroke that follows the cursor. Static fill stays
// readable when there is no hover (touch screens); the stroke lights up the
// letters under the pointer on desktop.
export function TextHoverEffect({ text }: { text: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mask = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, white, transparent)`;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 160"
      onMouseMove={onMove}
      className="h-auto w-full select-none"
      role="img"
      aria-label={text}
    >
      <defs>
        <motion.mask id="hover-mask" style={{ WebkitMaskImage: mask }}>
          <rect width="600" height="160" fill="white" />
        </motion.mask>
      </defs>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        className="font-display"
        fontSize="118"
        letterSpacing="2"
      >
        {text}
      </text>
      <g mask="url(#hover-mask)">
        <text
          x="50%"
          y="68%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="none"
          stroke="#FF5A1F"
          strokeWidth="2"
          className="font-display"
          fontSize="118"
          letterSpacing="2"
        >
          {text}
        </text>
      </g>
    </svg>
  );
}
