import PageBackground from "@/components/PageBackground";

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageBackground
        src="/06.jpg"
        gradientX="bg-linear-to-l from-black/35 via-black/55 to-black/5"
        gradientY="bg-linear-to-b from-black/0 via-black/40 to-black/80"
        gradientTop="bg-linear-to-t from-black/0 via-black/0 to-black/20"
      />
      {children}
    </>
  );
}
