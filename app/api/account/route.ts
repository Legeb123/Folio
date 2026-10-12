import { auth, googleConfigured } from "@/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = googleConfigured ? await auth() : null;
  return Response.json(
    {
      configured: googleConfigured,
      user: session?.user
        ? { name: session.user.name, email: session.user.email }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
