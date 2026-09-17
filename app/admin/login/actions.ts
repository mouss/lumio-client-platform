"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { motDePasseValide } from "@/lib/auth";
import { COOKIE_SESSION, creerJeton } from "@/lib/session";

export async function seConnecter(donnees: FormData) {
  const motDePasse = String(donnees.get("motDePasse") ?? "");

  if (!motDePasseValide(motDePasse)) {
    redirect("/admin/login?erreur=identifiants");
  }

  const session = await creerJeton();

  if (!session) {
    redirect("/admin/login?erreur=configuration");
  }

  const magasin = await cookies();

  magasin.set(COOKIE_SESSION, session.valeur, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expireLe,
  });

  redirect("/admin");
}

export async function seDeconnecter() {
  const magasin = await cookies();

  magasin.delete(COOKIE_SESSION);

  redirect("/admin/login");
}
