import { NextResponse } from "next/server";

// Fiches clients : creation par le webhook Calendly, lecture et mise a jour depuis /admin.

export async function GET() {
  return NextResponse.json(
    { route: "/api/clients", method: "GET", status: "not_implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { route: "/api/clients", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
