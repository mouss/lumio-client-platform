import { NextResponse } from "next/server";

// Questionnaire d'onboarding : reponses envoyees depuis /onboarding/[token].

export async function GET() {
  return NextResponse.json(
    { route: "/api/questionnaire", method: "GET", status: "not_implemented" },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { route: "/api/questionnaire", method: "POST", status: "not_implemented" },
    { status: 501 },
  );
}
