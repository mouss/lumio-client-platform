import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumio Digital",
  description:
    "Plateforme client Lumio Digital : audit, offre, onboarding et suivi projet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-lumio-black font-sans text-lumio-white antialiased">
        {children}
      </body>
    </html>
  );
}
