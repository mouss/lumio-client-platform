import { NextResponse } from "next/server";

// Abonnements : maintenance mensuelle et echeances de paiement du Sprint.

export async function GET() {
  return NextResponse.json(
    { route: "/api/abonnements", method: "GET", status: "not_implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { route: "/api/abonnements", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
