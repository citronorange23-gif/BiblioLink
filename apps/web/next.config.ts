import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export", // Indispensable pour Capacitor (génère un site 100% statique)
  images: {
    unoptimized: true, // Nécessaire avec 'output: export' car le composant Image de Next.js ne peut pas s'optimiser sans serveur
  },
};

export default nextConfig;