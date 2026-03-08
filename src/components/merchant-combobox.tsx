'use client';

import { useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface MerchantOption {
  id: string;
  name: string;
}

interface MerchantComboboxProps {
  value: string;
  onChange: (value: string) => void;
  merchants: MerchantOption[];
}

export function MerchantCombobox({ value, onChange, merchants }: MerchantComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = inputValue
    ? merchants.filter((m) => m.name.toLowerCase().includes(inputValue.toLowerCase()))
    : merchants;

  const showCreateOption = inputValue && !merchants.some(
    (m) => m.name.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {value || 'Wybierz lub wpisz sprzedawcę...'}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {value && (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Szukaj sprzedawcy..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {inputValue ? 'Brak wyników' : 'Wpisz nazwę sprzedawcy'}
              </CommandEmpty>
              <CommandGroup>
                {showCreateOption && (
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={() => {
                      onChange(inputValue);
                      setOpen(false);
                      setInputValue('');
                    }}
                  >
                    <span>Dodaj: <strong>{inputValue}</strong></span>
                  </CommandItem>
                )}
                {filtered.map((merchant) => (
                  <CommandItem
                    key={merchant.id}
                    value={merchant.name}
                    onSelect={() => {
                      onChange(merchant.name === value ? '' : merchant.name);
                      setOpen(false);
                      setInputValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === merchant.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {merchant.name}
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
