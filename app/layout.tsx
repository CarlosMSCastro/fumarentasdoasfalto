import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Map from "@/components/Map";
import { auth } from "@/auth";

const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Fumarentas do Asfalto",
  description: "Associação de apaixonados por motorizadas",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="pt"
      className={`${rajdhani.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar session={session} />
        <div className="fixed top-0 left-0 w-full h-87.5 opacity-0 -z-50 pointer-events-none" aria-hidden="true">
          <Map />
        </div>
        {children}
        {modal}
      </body>
    </html>
  );
}