import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Map from "@/components/Map";
import SharedBackground from "@/components/SharedBackground";
import RotateDevicePrompt from "@/components/RotateDevicePrompt";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { CartProvider } from "@/lib/cart";
import { auth } from "@/auth";
import { getTextos } from "@/lib/textos";

const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const TITLE = "Fumarentas do Asfalto";
const DESCRICAO = "Associação de apaixonados por motorizadas";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${TITLE}` },
  description: DESCRICAO,
  verification: {
    other: {
      "facebook-domain-verification": "a050acb440wpfovfd7b2khvek99grx",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRICAO,
    url: SITE_URL,
    siteName: TITLE,
    images: ["/logo.png"],
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRICAO,
    images: ["/logo.png"],
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
  const textos = await getTextos();

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
          <CartProvider>
            <Navbar facebookUrl={textos["social.facebook.url"]} instagramUrl={textos["social.instagram.url"]} />
            <div className="fixed top-0 left-0 w-full h-87.5 opacity-0 -z-50 pointer-events-none" aria-hidden="true">
              <Map />
            </div>
            <SharedBackground />
            {children}
            {modal}
            <RotateDevicePrompt />
          </CartProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}