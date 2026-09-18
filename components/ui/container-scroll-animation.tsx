'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Scroll-linked 3D card: tilts flat and scales up as it enters the viewport.
// Wrap the hero visual in it; keep the page CTA below so the scroll leads
// somewhere (login/signup).
export function ContainerScroll({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [28, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.4, 1]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-8 py-10">
      <div className="max-w-3xl text-center">{title}</div>
      <motion.div
        style={{ rotateX, scale, opacity, transformPerspective: 1200 }}
        className="w-full max-w-3xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
