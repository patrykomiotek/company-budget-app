import { Resend } from "resend";
import { PasswordResetEmail } from "@/app/emails/password-reset-email";
import { WelcomeEmail } from "@/app/emails/welcome-email";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = "Dashboard finansowy <noreply@updates.webamigos.pl>";

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  try {
    const response = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Zresetuj hasło",
      react: PasswordResetEmail({ resetUrl }),
    });
    return { data: response };
  } catch (error) {
    console.error("[MAILER] Failed to send password reset email", {
      to,
      error,
    });
    return { error: "Nie udało się wysłać emaila z resetem hasła" };
  }
}

export async function sendWelcomeEmail({
  to,
  name,
  loginUrl,
}: {
  to: string;
  name?: string;
  loginUrl: string;
}) {
  try {
    const response = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Witaj w Dashboard finansowym",
      react: WelcomeEmail({ name, loginUrl }),
    });
    return { data: response };
  } catch (error) {
    console.error("[MAILER] Failed to send welcome email", { to, error });
    return { error: "Nie udało się wysłać powitalnego emaila" };
  }
}
