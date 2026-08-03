import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Map from "@/components/Map";
import SharedBackground from "@/components/SharedBackground";
import RotateDevicePrompt from "@/components/RotateDevicePrompt";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { auth } from "@/auth";

const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Fumarentas do Asfalto",
  description: "Associação de apaixonados por motorizadas",
  verification: {
    other: {
      "facebook-domain-verification": "9f5ktdm0h8uw3erskbxw3ur4xkk0qm",
    },
  },
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
        <SessionProviderWrapper session={session}>
          <Navbar />
          <div className="fixed top-0 left-0 w-full h-87.5 opacity-0 -z-50 pointer-events-none" aria-hidden="true">
            <Map />
          </div>
          <SharedBackground />
          {children}
          {modal}
          <RotateDevicePrompt />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}