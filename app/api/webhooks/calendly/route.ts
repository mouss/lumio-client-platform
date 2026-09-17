import { NextResponse } from "next/server";

// Reception des reservations et annulations Calendly.
// Chaque appel doit etre verifie contre CALENDLY_WEBHOOK_SIGNING_KEY avant tout traitement.
// La creation de fiche client par ce webhook doit etre idempotente : une meme reservation ne cree jamais deux fiches.

export async function POST() {
  return NextResponse.json(
    {
      route: "/api/webhooks/calendly",
      method: "POST",
      status: "not_implemented",
    },
    { status: 501 },
  );
}
