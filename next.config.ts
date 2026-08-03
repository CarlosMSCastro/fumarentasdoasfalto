import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.180", "192.168.1.*"],
  // Por omissão o Next limita o corpo de uma Server Action a 1MB — o upload
  // de foto de perfil (atualizarFoto) valida até 5MB no próprio código, por
  // isso o limite do framework tem de acompanhar, senão fotos de telemóvel
  // (facilmente >1MB) são rejeitadas pelo Next antes de chegarem ao código.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
