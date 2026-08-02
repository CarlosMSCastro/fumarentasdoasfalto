"use client";
import { useEffect, useState } from "react";

// Transição de opacidade via `transition` (não `animation`), de propósito:
// a keyframe `enter` da tw-animate-css anima sempre `transform` (mesmo só
// com `fade-in`, a valores neutros), e um ancestor com uma animação de
// transform ativa cria um novo containing block para descendentes
// `position: fixed` — isso desalinhava o modal de eventos (que herda este
// template por navegar através dele) durante o segundo da transição.
export default function Template({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`transition-opacity duration-1000 ease-out ${visible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}
