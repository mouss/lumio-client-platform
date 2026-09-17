import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/*
  Envoi des emails clients : bienvenue apres signature, questionnaire d'onboarding, relances.
  Les identifiants SMTP viennent du .env, jamais du code.
  Le guide d'onboarding est explicite : les emails doivent garder une signature humaine,
  jamais un envoi automatique impersonnel.
*/

let transport: Transporter | null = null;

export function getTransport(): Transporter {
  if (transport) {
    return transport;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Configuration SMTP incomplete : renseigner SMTP_HOST, SMTP_USER et SMTP_PASSWORD dans .env",
    );
  }

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transport;
}

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail({ to, subject, text, html }: SendMailInput) {
  const from = process.env.SMTP_USER;

  if (!from) {
    throw new Error(
      "SMTP_USER manquant : impossible de definir l'expediteur du message.",
    );
  }

  return getTransport().sendMail({ from, to, subject, text, html });
}
