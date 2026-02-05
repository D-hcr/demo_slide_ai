// /lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // authorization: { params: { scope: "openid email profile" } },
    }),
  ],

  // ✅ Cloud/Prod için zorunlu
  secret: process.env.AUTH_SECRET,

  // ✅ Cloudflare/Vercel benzeri reverse-proxy ortamlarında çok kritik
  trustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.NODE_ENV === "production",

  // ✅ Senin Prisma Session modelin var -> database session doğru seçim
  session: { strategy: "database" },

  callbacks: {
    async session({ session, user }) {
      // ✅ route'larda session.user.id kullanabilmen için
      if (session.user) {
        ;(session.user as any).id = user.id
      }
      return session
    },
  },

  // ✅ tek login ekranı: /login (senin app/(auth)/login/page.tsx)
  pages: {
    signIn: "/login",
  },
})
