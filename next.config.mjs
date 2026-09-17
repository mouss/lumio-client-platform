/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /*
      better-sqlite3 est un module natif : il charge un binaire .node depuis son propre dossier.
      Si webpack l'embarque dans le bundle serveur, le paquet bindings ne retrouve plus son binaire
      et Prisma echoue avec "Cannot read properties of undefined (reading 'indexOf')".
      Le declarer externe laisse Node le resoudre normalement au runtime.
    */
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "@prisma/adapter-better-sqlite3",
    ],
  },
};

export default nextConfig;
