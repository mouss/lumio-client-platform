import { sendMail } from "@/lib/email";
import {
  genererPdfRestitution,
  type ClientPourPdf,
  type RestitutionPourPdf,
} from "@/lib/pdf/restitution-pdf";
import { slugFichier } from "@/lib/format";
import { urlPublique } from "@/lib/urls";

/*
  Email d'envoi de l'offre au prospect, apres l'audit.

  Ton : remerciement pour le temps accorde pendant l'audit, annonce que la restitution
  complete et l'offre sont pretes sur la page publique, et le PDF de l'audit en piece
  jointe pour qu'il puisse le garder ou le montrer en interne.

  Le PDF est fabrique par genererPdfRestitution, la meme fonction que celle utilisee par
  la route de telechargement : pas de deuxieme facon de produire ce document, et aucun
  appel HTTP interne.

  Signature humaine, jamais un envoi impersonnel : c'est une regle du guide d'onboarding.
*/

export type ClientPourEnvoiOffre = ClientPourPdf & {
  email: string;
  token: string;
};

export function nomFichierPdfRestitution(client: ClientPourPdf): string {
  return `Audit-IA-Lumio-${slugFichier(client.entreprise || client.nom)}.pdf`;
}

function corpsEmail({
  client,
  offreTitre,
  lien,
}: {
  client: ClientPourEnvoiOffre;
  offreTitre: string;
  lien: string;
}): string {
  const destinataire = client.nom;

  return [
    `Bonjour ${destinataire},`,
    "",
    "Merci pour le temps que vous m'avez accordé pendant l'audit. J'ai repris ce que nous avons vu et j'ai mis par écrit ce qui ressort de votre situation.",
    "",
    "La restitution complète et la proposition sont prêtes ici :",
    lien,
    "",
    `Vous y trouverez le détail de l'audit, les pistes que j'ai identifiées, et l'offre que je vous propose (${offreTitre}).`,
    "",
    "Je joins aussi la restitution en PDF, pour que vous puissiez la garder ou la montrer en interne.",
    "",
    "Dites-moi ce que vous en pensez, je reste disponible pour en parler.",
    "",
    "Moussa Diallo",
    "Lumio Digital",
  ].join("\n");
}

export async function envoyerEmailOffre({
  client,
  offreTitre,
  restitution,
}: {
  client: ClientPourEnvoiOffre;
  offreTitre: string;
  restitution: RestitutionPourPdf;
}): Promise<void> {
  const lien = urlPublique(`/offres/${client.token}`);
  const pdf = await genererPdfRestitution(client, restitution);

  await sendMail({
    to: client.email,
    subject: `Votre audit et notre proposition, ${offreTitre}`,
    text: corpsEmail({ client, offreTitre, lien }),
    attachments: [
      {
        filename: nomFichierPdfRestitution(client),
        content: pdf,
      },
    ],
  });
}
