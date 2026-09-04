import { Calendar, CheckSquare, Home, MessageCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

type Props = {
  activeTab: string;
  onNavigate: (tab: string) => void;
  center: (compactProgress: number) => ReactNode;
  forceExpanded?: boolean;
  destinations?: readonly MobileDestination[];
  scrollContainerRef?: RefObject<HTMLElement | null>;
};

export type MobileDestination = { id: string; label: string; icon: LucideIcon };

const defaultDestinations = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'activities', label: 'Actividades', icon: CheckSquare },
  { id: 'chat', label: 'Chats', icon: MessageCircle },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (expanded: number, compact: number, progress: number) => expanded + (compact - expanded) * progress;

function useScrollCompactProgress(forceExpanded: boolean, scrollContainerRef?: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const lastScrollRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current ?? document.scrollingElement;
    lastScrollRef.current = scrollElement?.scrollTop ?? window.scrollY;

    const animateTowardsTarget = () => {
      const difference = targetProgressRef.current - progressRef.current;
      if (Math.abs(difference) < 0.0005) {
        progressRef.current = targetProgressRef.current;
        setProgress(targetProgressRef.current);
        animationFrameRef.current = null;
        return;
      }

      progressRef.current += difference * 0.14;
      setProgress(progressRef.current);
      animationFrameRef.current = window.requestAnimationFrame(animateTowardsTarget);
    };

    const startProgressAnimation = () => {
      if (animationFrameRef.current == null) {
        animationFrameRef.current = window.requestAnimationFrame(animateTowardsTarget);
      }
    };

    const updateTarget = () => {
      scrollFrameRef.current = null;
      const currentScroll = scrollElement?.scrollTop ?? window.scrollY;
      const delta = currentScroll - lastScrollRef.current;
      lastScrollRef.current = currentScroll;

      if (forceExpanded || currentScroll <= 12) {
        targetProgressRef.current = 0;
        if (reduceMotion) {
          progressRef.current = 0;
          setProgress(0);
        } else {
          startProgressAnimation();
        }
        return;
      }
      if (Math.abs(delta) < 3) return;

      const boundedDelta = Math.min(36, Math.max(-36, delta));
      targetProgressRef.current = reduceMotion
        ? (delta > 0 ? 1 : 0)
        : clamp(targetProgressRef.current + boundedDelta / 480);

      if (reduceMotion) {
        progressRef.current = targetProgressRef.current;
        setProgress(targetProgressRef.current);
      } else {
        startProgressAnimation();
      }
    };

    const onScroll = () => {
      if (scrollFrameRef.current == null) scrollFrameRef.current = window.requestAnimationFrame(updateTarget);
    };

    const target = scrollContainerRef?.current ?? window;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (scrollFrameRef.current != null) window.cancelAnimationFrame(scrollFrameRef.current);
      if (animationFrameRef.current != null) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [forceExpanded, reduceMotion, scrollContainerRef]);

  useEffect(() => {
    if (!forceExpanded) return;
    targetProgressRef.current = 0;
    progressRef.current = 0;
    setProgress(0);
  }, [forceExpanded]);

  return forceExpanded ? 0 : progress;
}

export default function BelongingMobileBottomNav({ activeTab, onNavigate, center, forceExpanded = false, destinations = defaultDestinations, scrollContainerRef }: Props) {
  const compactProgress = useScrollCompactProgress(forceExpanded, scrollContainerRef);
  const iconSize = lerp(20, 17, compactProgress);
  const textSize = lerp(10, 8.5, compactProgress);
  const itemGap = lerp(3, 1, compactProgress);
  const itemHorizontalPadding = lerp(4, 1, compactProgress);

  const renderDestination = (index: number) => {
    const item = destinations[index];
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        aria-label={`Ir a ${item.label}`}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 ${active ? 'bg-[#efe6fb] text-[#6b3faf]' : 'text-[#756a82] hover:bg-white/55 hover:text-[#6b3faf]'}`}
        style={{ gap: itemGap, paddingLeft: itemHorizontalPadding, paddingRight: itemHorizontalPadding }}
      >
        <item.icon size={iconSize} aria-hidden />
        <span className="max-w-full whitespace-nowrap" style={{ fontSize: textSize, lineHeight: 1.05 }}>{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div
        className="mx-auto flex w-full max-w-2xl items-center gap-0.5 border border-white/75 bg-white/80 backdrop-blur-xl backdrop-saturate-150"
        style={{
          width: `calc(100% - ${lerp(0, 24, compactProgress)}px)`,
          height: lerp(74, 56, compactProgress),
          paddingLeft: lerp(6, 3, compactProgress),
          paddingRight: lerp(6, 3, compactProgress),
          borderRadius: lerp(30, 24, compactProgress),
          boxShadow: `0 ${lerp(8, 5, compactProgress)}px ${lerp(28, 18, compactProgress)}px rgba(77,45,112,${lerp(0.18, 0.14, compactProgress)})`,
        }}
      >
        {renderDestination(0)}
        {renderDestination(1)}
        <div className="flex min-w-[68px] flex-1 items-center justify-center px-1">{center(compactProgress)}</div>
        {renderDestination(2)}
        {renderDestination(3)}
      </div>
    </nav>
  );
}
