import { Button, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Zresetuj hasło">
      <Text className="text-base leading-6 text-[#525f7f]">
        Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.
      </Text>
      <Text className="text-base leading-6 text-[#525f7f]">
        Kliknij poniższy przycisk, aby ustawić nowe hasło:
      </Text>
      <Button
        className="block w-full rounded-[5px] bg-[#1a1a2e] px-2.5 py-2.5 text-center text-base font-bold text-white no-underline"
        href={resetUrl}
      >
        Zresetuj hasło
      </Button>
      <Hr className="my-5 border-[#e6ebf1]" />
      <Text className="text-sm leading-5 text-[#8898aa]">
        Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Link wygaśnie
        za 1 godzinę.
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetEmail;
