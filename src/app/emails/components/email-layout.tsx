import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#f6f9fc] font-sans">
          <Container className="mx-auto mb-16 bg-white py-5 pb-12">
            <Section className="px-12">
              <Text className="text-xl font-bold text-[#1a1a2e]">
                Dashboard finansowy
              </Text>
              <Hr className="my-5 border-[#e6ebf1]" />
              {children}
              <Hr className="my-5 border-[#e6ebf1]" />
              <Text className="text-xs leading-4 text-[#8898aa]">
                Dashboard finansowy by Web Amigos
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
