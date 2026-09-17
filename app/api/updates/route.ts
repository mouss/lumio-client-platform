import { NextResponse } from "next/server";

// Mises a jour projet : publication des nouvelles visibles dans /espace/[token].

export async function GET() {
  return NextResponse.json(
    { route: "/api/updates", method: "GET", status: "not_implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { route: "/api/updates", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
