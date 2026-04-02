"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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

interface ProjectOption {
  id: string;
  name: string;
}

interface ProjectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  projects: ProjectOption[];
}

export function ProjectCombobox({
  value,
  onChange,
  projects,
}: ProjectComboboxProps) {
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
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : projects;

  const showCreateOption =
    inputValue &&
    !projects.some((p) => p.name.toLowerCase() === inputValue.toLowerCase());

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
          {value || "Wybierz lub dodaj projekt..."}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {value && (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
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
              placeholder="Szukaj projektu..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {!showCreateOption && filtered.length === 0 && (
                <CommandEmpty>
                  {inputValue ? "Brak wyników" : "Wpisz nazwę projektu"}
                </CommandEmpty>
              )}
              <CommandGroup>
                {showCreateOption && (
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={() => {
                      onChange(inputValue);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <span>
                      Dodaj: <strong>{inputValue}</strong>
                    </span>
                  </CommandItem>
                )}
                {filtered.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => {
                      onChange(project.name === value ? "" : project.name);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === project.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{project.name}</span>
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
