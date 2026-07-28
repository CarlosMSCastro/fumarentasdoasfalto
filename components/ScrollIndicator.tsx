"use client";

interface ScrollIndicatorProps {
  targetId: string;
  className?: string;
  id?: string;
  // Shrinks the indicator on mobile only (reverts to normal size at md:) —
  // used where the mobile layout needs to reclaim vertical space.
  compact?: boolean;
}

export default function ScrollIndicator({ targetId, className = "", id, compact = false }: ScrollIndicatorProps) {
  return (
    <button
      id={id}
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })}
      className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer bg-transparent border-none group ${className}`}
    >
      <svg className={`${compact ? "w-5 h-5 md:w-8 md:h-8" : "w-8 h-8"} text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      <svg className={`${compact ? "-mt-3 w-6 h-6 md:-mt-5 md:w-9 md:h-9" : "-mt-5 w-9 h-9"} text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}