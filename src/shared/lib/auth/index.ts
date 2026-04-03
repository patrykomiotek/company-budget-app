import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/shared/lib/prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    async sendResetPassword({ user, url }) {
      const { sendPasswordResetEmail } = await import("@/shared/lib/mailer");
      await sendPasswordResetEmail({ to: user.email, resetUrl: url });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});
