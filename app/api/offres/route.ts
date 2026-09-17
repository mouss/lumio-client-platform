import { NextResponse } from "next/server";

// Offres commerciales : construction, envoi du lien /offres/[token], acceptation par le prospect.

export async function GET() {
  return NextResponse.json(
    { route: "/api/offres", method: "GET", status: "not_implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { route: "/api/offres", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
