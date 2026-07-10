"use client";

interface ScrollIndicatorProps {
  targetId: string;
  className?: string;
}

export default function ScrollIndicator({ targetId, className = "" }: ScrollIndicatorProps) {
  return (
    <button
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })}
      className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer bg-transparent border-none group ${className}`}
    >
      <svg className="w-8 h-8 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      <svg className="-mt-5 w-9 h-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] group-hover:scale-125 group-hover:text-orange-500 transition-all duration-300 animate-bounce [animation-delay:0ms]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}