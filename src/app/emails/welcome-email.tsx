import { Button, Hr, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface WelcomeEmailProps {
  name?: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Witaj w Dashboard finansowym">
      <Text className="text-base leading-6 text-[#525f7f]">
        {name ? `Cześć ${name},` : "Cześć,"}
      </Text>
      <Text className="text-base leading-6 text-[#525f7f]">
        Twoje konto administratora zostało utworzone. Możesz teraz zarządzać
        transakcjami, kategoriami i raportami finansowymi.
      </Text>
      <Button
        className="block w-full rounded-[5px] bg-[#1a1a2e] px-2.5 py-2.5 text-center text-base font-bold text-white no-underline"
        href={loginUrl}
      >
        Przejdź do aplikacji
      </Button>
      <Hr className="my-5 border-[#e6ebf1]" />
      <Text className="text-sm leading-5 text-[#8898aa]">
        Ten email został wysłany automatycznie po utworzeniu konta.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
