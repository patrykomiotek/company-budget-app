"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ProductOption {
  id: string;
  name: string;
  type?: string;
}

interface ProductComboboxProps {
  value: string;
  onChange: (value: string, type?: "PRODUCT" | "SERVICE") => void;
  products: ProductOption[];
}

export function ProductCombobox({
  value,
  onChange,
  products,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = inputValue
    ? products.filter((p) =>
        p.name.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : products;

  const showCreateOption =
    inputValue &&
    !products.some((p) => p.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal text-sm h-8"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{value || "Produkt / usługa..."}</span>
        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[250px] rounded-md border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Szukaj lub wpisz nazwę..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {!showCreateOption && filtered.length === 0 && (
                <CommandEmpty>
                  {inputValue
                    ? "Brak wyników"
                    : "Wpisz nazwę produktu lub usługi"}
                </CommandEmpty>
              )}
              <CommandGroup>
                {showCreateOption && (
                  <>
                    <CommandItem
                      value={`create-service-${inputValue}`}
                      onSelect={() => {
                        onChange(inputValue, "SERVICE");
                        setOpen(false);
                        setInputValue("");
                      }}
                    >
                      <span>
                        Dodaj usługę: <strong>{inputValue}</strong>
                      </span>
                    </CommandItem>
                    <CommandItem
                      value={`create-product-${inputValue}`}
                      onSelect={() => {
                        onChange(inputValue, "PRODUCT");
                        setOpen(false);
                        setInputValue("");
                      }}
                    >
                      <span>
                        Dodaj produkt: <strong>{inputValue}</strong>
                      </span>
                    </CommandItem>
                  </>
                )}
                {filtered.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => {
                      onChange(product.name === value ? "" : product.name);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{product.name}</span>
                    {product.type && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {product.type === "SERVICE" ? "usługa" : "produkt"}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
