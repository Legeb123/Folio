import { handlers, googleConfigured } from "@/auth";
import { NextRequest } from "next/server";
function unavailable() {
  return Response.json(
    { error: "Google sign-in is not configured." },
    { status: 503 },
  );
}
export function GET(request: NextRequest) {
  return googleConfigured ? handlers.GET(request) : unavailable();
}
export function POST(request: NextRequest) {
  return googleConfigured ? handlers.POST(request) : unavailable();
}
