import { NextResponse } from "next/server";

// Emails clients : bienvenue, questionnaire, relances. Passent par lib/email.ts.

export async function POST() {
  return NextResponse.json(
    { route: "/api/emails", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
