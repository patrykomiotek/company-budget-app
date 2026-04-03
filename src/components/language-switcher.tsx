"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const nextLocale = locale === "pl" ? "en" : "pl";
  const label = locale === "pl" ? "English" : "Polski";

  function handleSwitch() {
    startTransition(() => {
      router.push({ pathname }, { locale: nextLocale });
    });
  }

  return (
    <button
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left"
      onClick={handleSwitch}
      disabled={isPending}
    >
      <Globe className="h-4 w-4" />
      {label}
    </button>
  );
}
