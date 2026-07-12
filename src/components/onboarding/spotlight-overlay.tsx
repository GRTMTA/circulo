"use client";

import { useEffect, useRef, useState } from "react";

interface SpotlightOverlayProps {
  targetRect: DOMRect | null;
  padding?: number;
}

/**
 * Full-screen fixed overlay with a smooth animated cutout around the spotlight target.
 */
export function SpotlightOverlay({ targetRect, padding = 8 }: SpotlightOverlayProps) {
  const [animatedRect, setAnimatedRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const frameRef = useRef<number>(0);
  const currentRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const targetRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const activeRef = useRef(false);

  useEffect(() => {
    if (!targetRect) {
      setAnimatedRect(null);
      activeRef.current = false;
      cancelAnimationFrame(frameRef.current);
      return;
    }

    const dest = {
      x: targetRect.left - padding,
      y: targetRect.top - padding,
      w: targetRect.width + padding * 2,
      h: targetRect.height + padding * 2,
    };
    targetRef.current = dest;

    // If first time, snap immediately
    if (!activeRef.current) {
      currentRef.current = { ...dest };
      setAnimatedRect({ ...dest });
      activeRef.current = true;
      return;
    }

    // Lerp animation loop
    function animate() {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const ease = 0.25;

      cur.x += (tgt.x - cur.x) * ease;
      cur.y += (tgt.y - cur.y) * ease;
      cur.w += (tgt.w - cur.w) * ease;
      cur.h += (tgt.h - cur.h) * ease;

      setAnimatedRect({ ...cur });

      const dx = Math.abs(tgt.x - cur.x);
      const dy = Math.abs(tgt.y - cur.y);
      const dw = Math.abs(tgt.w - cur.w);
      const dh = Math.abs(tgt.h - cur.h);

      if (dx > 0.5 || dy > 0.5 || dw > 0.5 || dh > 0.5) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to final
        currentRef.current = { ...tgt };
        setAnimatedRect({ ...tgt });
      }
    }

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [targetRect, padding]);

  if (!animatedRect) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998]"
      aria-hidden="true"
    >
      <div
        className="absolute rounded-xl"
        style={{
          top: animatedRect.y,
          left: animatedRect.x,
          width: animatedRect.w,
          height: animatedRect.h,
          boxShadow:
            "0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 0 2px var(--color-primary-default)",
          borderRadius: 12,
        }}
      />
    </div>
  );
}
