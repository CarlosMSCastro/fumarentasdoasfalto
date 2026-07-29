// A navegação para "Contactos" a partir de fora dessa secção (navbar, cards
// de Objetivos) tem de ignorar o scroll-snap do #snap-container por um
// instante, senão o snap intercepta o scrollTo a meio e prende o utilizador
// na secção errada. Reativa o snap assim que a animação termina.
export function scrollToContactosBypassingSnap() {
  const container = document.getElementById("snap-container");
  const contactos = document.getElementById("contactos");
  if (!container || !contactos) return;
  container.style.scrollSnapType = "none";
  container.scrollTo({ top: contactos.offsetTop, behavior: "smooth" });
  container.addEventListener(
    "scrollend",
    () => {
      container.style.scrollSnapType = "y mandatory";
    },
    { once: true }
  );
}
