/*
  Contenu des offres, fige en constantes.

  Regle : ce contenu est ecrit une fois pour toutes et ne se regenere jamais. Il vient
  du vault Lumio Digital (offres.md) et, pour l'Extension Second Cerveau, du texte fourni
  par Moussa le 17/09/2026. Ne pas reformuler a la generation, ne pas laisser un modele
  reecrire ces phrases.

  Toute modification de tarif ou de livrable se fait ici, et se repercute dans le vault.
*/

export type TypeOffre = "QUICK_WIN" | "EXTENSION_SECOND_CERVEAU" | "SPRINT";

export const LIBELLES_TYPE_OFFRE: Record<TypeOffre, string> = {
  QUICK_WIN: "Pack Quick Win : Votre Employé IA 24/7",
  EXTENSION_SECOND_CERVEAU: "Extension Second Cerveau",
  SPRINT: "AI Operations Sprint",
};

export const CONTENU_QUICK_WIN = {
  titre: "Pack Quick Win : Votre Employé IA 24/7",
  montant: 490,
  description:
    "Déléguez vos tâches chronophages à un assistant virtuel sur-mesure qui travaille pour vous, même quand votre ordinateur est éteint.",
  livrables: [
    "Configuration et hébergement clé en main sur un VPS dédié 24h/24 7j/7",
    "Accès mobile par Telegram, WhatsApp ou Slack, au choix du client",
    "Optimisation avancée des coûts via les skills Defut et Caveman (jusqu'à une division par 3 de la facture d'API)",
    "Un premier autopilote opérationnel (cron job), une routine quotidienne sur-mesure à définir avec le client",
    "Une session de prise en main et transfert de 30 minutes",
  ],
  modaliteFacturement:
    "Paiement en une fois à la commande, facture émise à la validation",
  // La maintenance est une option, decochee par defaut : elle ne s'impose pas au client.
  abonnementParDefaut: false,
};

export const CONTENU_SECOND_CERVEAU = {
  titre: "Extension Second Cerveau",
  description:
    "Votre assistant IA ne se contente plus de répondre : il apprend et se souvient.",
  livrables: [
    "Intégration d'Obsidian à votre agent IA, comme base de connaissance personnelle consultable et enrichissable.",
    "Migration de vos notes existantes dans cette base, pour repartir avec l'historique déjà en place plutôt que d'une page blanche.",
    "Mise en place d'une boucle d'apprentissage autonome : l'agent enrichit sa base de connaissance au fil de l'usage, au lieu de rester figé sur sa configuration initiale.",
  ],
  // Upsell sur un Pack deja vendu ou en cours de vente.
  montantUpsell: 500,
  // Pack dedie : les deux vendus ensemble des le depart.
  montantPackDedie: 990,
  // Meme logique de paiement que le Pack Quick Win.
  modaliteFacturement:
    "Paiement en une fois, facture émise à la validation de l'offre par le client",
};

export const CONTENU_SPRINT = {
  titre: "AI Operations Sprint",
  description: "",
  livrables: [] as string[],
  modaliteFacturement:
    "20 % à la validation du Blueprint, 60 % à la mise en production, 20 % à la formation et clôture",
  /*
    Tarification a la valeur : 25 a 30 % de la valeur annuelle creee. Le montant reste
    vide par defaut, Moussa le saisit. Le calcul propose une fourchette indicative.
  */
  pourcentageMin: 25,
  pourcentageMax: 30,
};

export function fourchetteSprint(valeurAnnuelle: number): {
  min: number;
  max: number;
} {
  return {
    min: Math.round((valeurAnnuelle * CONTENU_SPRINT.pourcentageMin) / 100),
    max: Math.round((valeurAnnuelle * CONTENU_SPRINT.pourcentageMax) / 100),
  };
}
