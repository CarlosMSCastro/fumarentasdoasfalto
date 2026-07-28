export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in ease-out duration-1000">
      {children}
    </div>
  );
}
