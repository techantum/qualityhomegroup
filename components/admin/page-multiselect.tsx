"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ALL_PAGES_SLUG, type SitePageOption } from "@/lib/site-pages";

interface PageMultiSelectProps {
  pages: SitePageOption[];
  selected: string[];
  appliesToAll: boolean;
  takenSlugs: Set<string>;
  allTaken: boolean;
  onChange: (next: { appliesToAll: boolean; pageSlugs: string[] }) => void;
  disabled?: boolean;
}

export function PageMultiSelect({
  pages,
  selected,
  appliesToAll,
  takenSlugs,
  allTaken,
  onChange,
  disabled,
}: PageMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const availablePages = useMemo(
    () => pages.filter((page) => !takenSlugs.has(page.slug) || selected.includes(page.slug)),
    [pages, takenSlugs, selected],
  );

  const showAllOption = appliesToAll || (!allTaken && takenSlugs.size === 0);

  const label = appliesToAll
    ? "All pages"
    : selected.length === 0
      ? "Select pages"
      : selected.length === 1
        ? pages.find((page) => page.slug === selected[0])?.label ?? "1 page"
        : `${selected.length} pages selected`;

  const toggleAll = () => {
    if (appliesToAll) {
      onChange({ appliesToAll: false, pageSlugs: [] });
      return;
    }
    onChange({ appliesToAll: true, pageSlugs: [] });
  };

  const togglePage = (slug: string) => {
    if (appliesToAll) return;
    const next = selected.includes(slug)
      ? selected.filter((item) => item !== slug)
      : [...selected, slug];
    onChange({ appliesToAll: false, pageSlugs: next });
  };

  const removePage = (slug: string) => {
    onChange({ appliesToAll: false, pageSlugs: selected.filter((item) => item !== slug) });
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || (availablePages.length === 0 && !appliesToAll && !showAllOption)}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search pages..." />
            <CommandList>
              <CommandEmpty>No available pages.</CommandEmpty>
              <CommandGroup>
                {showAllOption && (
                  <CommandItem
                    value="all pages"
                    onSelect={toggleAll}
                    className="gap-2"
                  >
                    <Checkbox checked={appliesToAll} className="pointer-events-none" />
                    <span className="font-medium">All pages</span>
                  </CommandItem>
                )}
                {availablePages.map((page) => (
                  <CommandItem
                    key={page.slug}
                    value={`${page.label} ${page.slug}`}
                    disabled={appliesToAll}
                    onSelect={() => togglePage(page.slug)}
                    className="gap-2"
                  >
                    <Checkbox
                      checked={appliesToAll || selected.includes(page.slug)}
                      className="pointer-events-none"
                    />
                    <span>{page.label}</span>
                    <Check
                      className={`ml-auto h-4 w-4 ${
                        appliesToAll || selected.includes(page.slug) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {(appliesToAll || selected.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {appliesToAll ? (
            <Badge variant="secondary" className="gap-1">
              All pages
              <button type="button" onClick={toggleAll} className="rounded-sm hover:bg-black/10">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : (
            selected.map((slug) => (
              <Badge key={slug} variant="secondary" className="gap-1">
                {pages.find((page) => page.slug === slug)?.label ?? slug}
                <button type="button" onClick={() => removePage(slug)} className="rounded-sm hover:bg-black/10">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}
