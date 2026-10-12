import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
export const googleConfigured = Boolean(
  process.env.AUTH_SECRET &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET,
);
export const { handlers, auth } = NextAuth({
  providers: googleConfigured ? [Google] : [],
  session: { strategy: "jwt" },
  pages: { error: "/" },
});
