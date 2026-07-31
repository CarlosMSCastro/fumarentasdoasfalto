import EventosBackground from "@/components/EventosBackground";

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EventosBackground />
      {children}
    </>
  );
}
