import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genererPdfRestitution } from "@/lib/pdf/restitution-pdf";
import { nomFichierPdfRestitution } from "@/lib/emails/envoi-offre";

/*
  Telechargement du PDF de restitution, depuis la page publique de proposition.

  Route publique, sans compte : le token du client fait office d'autorisation, comme
  pour la page et l'acceptation. Le PDF est fabrique en memoire par la meme fonction que
  celle utilisee pour l'email, il n'est jamais ecrit sur le disque.

  Jamais de cache : une restitution peut etre corrigee tant qu'aucune offre n'est partie.
*/

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const client = await prisma.client.findUnique({
    where: { token: params.token },
    include: { restitution: true },
  });

  if (!client) {
    return NextResponse.json(
      { message: "Ce lien n'est plus valide." },
      { status: 404 },
    );
  }

  if (!client.restitution) {
    return NextResponse.json(
      { message: "La restitution de cet audit n'est pas encore disponible." },
      { status: 404 },
    );
  }

  const pdf = await genererPdfRestitution(client, client.restitution);
  const nomFichier = nomFichierPdfRestitution(client);

  /*
    Copie dans un tableau adosse a un ArrayBuffer neuf.
    TypeScript 5.7 type Buffer sur son tampon et refuse de le passer comme corps de
    reponse : la copie retire cette ambiguite, sans recopier les octets deux fois.
  */
  const corps = new Uint8Array(pdf.byteLength);
  corps.set(pdf);

  return new NextResponse(corps, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
