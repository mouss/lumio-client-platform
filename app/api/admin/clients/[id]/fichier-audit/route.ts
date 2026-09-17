import { readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSION, jetonValide } from "@/lib/session";
import {
  enteteContenu,
  estDansLeDepot,
  typeMime,
} from "@/lib/fichiers-audit";

/*
  Sert le fichier d'audit brut depuis le disque.

  Le fichier vit hors du dossier public : il n'est jamais accessible par une URL directe,
  seulement par cette route. Comme une route handler ne passe pas par le layout du groupe
  protege, la session est verifiee ici explicitement, avec la meme fonction que le layout.

  Redirection vers la connexion plutot qu'un 401 : le comportement reste celui du reste
  de /admin quand la session a expiré.
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const magasin = await cookies();

  if (!(await jetonValide(magasin.get(COOKIE_SESSION)?.value))) {
    redirect("/admin/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { fichierAuditChemin: true, fichierAuditNom: true },
  });

  if (!client?.fichierAuditChemin) {
    return NextResponse.json({ erreur: "fichier_absent" }, { status: 404 });
  }

  /*
    Le chemin vient de la base : on verifie qu'il reste dans le depot avant de lire,
    pour qu'une valeur alteree ne puisse pas servir n'importe quel fichier du serveur.
  */
  if (!estDansLeDepot(client.fichierAuditChemin)) {
    console.error(
      `Lecture refusée, chemin hors du dépôt : ${client.fichierAuditChemin}`,
    );
    return NextResponse.json({ erreur: "chemin_invalide" }, { status: 404 });
  }

  let contenu: Buffer;

  try {
    contenu = await readFile(client.fichierAuditChemin);
  } catch {
    console.error(
      `Fichier d'audit introuvable sur le disque : ${client.fichierAuditChemin}`,
    );
    return NextResponse.json({ erreur: "fichier_introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(contenu), {
    headers: {
      "Content-Type": typeMime(client.fichierAuditChemin),
      "Content-Disposition": enteteContenu(
        client.fichierAuditNom ?? "fichier-audit",
        "inline",
      ),
      // Contenu prive : jamais mis en cache par un intermediaire.
      "Cache-Control": "private, no-store",
    },
  });
}
