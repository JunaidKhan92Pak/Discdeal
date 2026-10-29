"use client";

/**
 * MagicCard from Magic UI (https://magicui.design/docs/components/magic-card, MIT licence), "gradient" mode only.
 * A soft spotlight follows the pointer over the card and lights its border. It only appears under a mouse, so
 * on phones the card stays plain. The "orb" mode and its next-themes dependency were left out.
 */
import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type MagicCardProps = {
  children?: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
};

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "var(--c-primary-soft)",
  gradientOpacity = 0.8,
  gradientFrom = "var(--c-primary)",
  gradientTo = "var(--c-primary-soft)",
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  const gradientSizeRef = useRef(gradientSize);

  useEffect(() => {
    gradientSizeRef.current = gradientSize;
  }, [gradientSize]);

  const reset = useCallback(() => {
    const off = -gradientSizeRef.current;
    mouseX.set(off);
    mouseY.set(off);
  }, [mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    const handleGlobalPointerOut = (e: globalThis.PointerEvent) => {
      if (!e.relatedTarget) reset();
    };
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") reset();
    };
    window.addEventListener("pointerout", handleGlobalPointerOut);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reset]);

  const border = useMotionTemplate`
    linear-gradient(var(--color-background) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, var(--color-border) 100%) border-box
  `;
  const spotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <motion.div
      className={cn("group relative isolate overflow-hidden rounded-[inherit] border border-transparent", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{ background: border }}
    >
      <div className="absolute inset-px z-20 rounded-[inherit] bg-background" />
      <motion.div
        suppressHydrationWarning
        className="pointer-events-none absolute inset-px z-30 rounded-[inherit]"
        style={{ background: spotlight, opacity: gradientOpacity }}
      />
      <div className="relative z-40 h-full">{children}</div>
    </motion.div>
  );
}
