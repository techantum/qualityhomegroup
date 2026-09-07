"use client";

import { useEffect, useState } from "react";
import { normalizeCompanyHistory, type CompanyHistoryItem } from "@/lib/company-history";
import { Reveal } from "@/components/motion/reveal";

export function CompanyHistorySection({
  items: itemsProp,
  loadFromCms = true,
  eyebrow,
  title,
}: {
  items?: CompanyHistoryItem[];
  loadFromCms?: boolean;
  eyebrow?: string;
  title?: string;
}) {
  const [items, setItems] = useState<CompanyHistoryItem[]>(itemsProp ?? []);
  const [eyebrowText, setEyebrowText] = useState(eyebrow || "Our Journey");
  const [titleText, setTitleText] = useState(title || "Company History & Projects");

  useEffect(() => {
    if (eyebrow) setEyebrowText(eyebrow);
    if (title) setTitleText(title);
  }, [eyebrow, title]);

  useEffect(() => {
    if (itemsProp?.length) {
      setItems(itemsProp);
      return;
    }
    if (!loadFromCms) return;
    async function load() {
      try {
        const res = await fetch("/api/v1/content/about", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setItems(normalizeCompanyHistory(json.data.history));
          if (json.data.historyEyebrow) setEyebrowText(String(json.data.historyEyebrow));
          if (json.data.historyTitle) setTitleText(String(json.data.historyTitle));
        }
      } catch (error) {
        console.error("Error loading company history:", error);
      }
    }
    load();
  }, [itemsProp, loadFromCms]);

  if (!items.length) return null;

  return (
    <section className="py-16 md:py-24 bg-[#F5F5F5]">
      <div className="max-w-[1200px] mx-auto px-4">
        <Reveal>
          <p className="text-[#DDA21A] text-sm font-semibold tracking-[0.2em] uppercase mb-3">{eyebrowText}</p>
          <h2 className="font-royal text-3xl md:text-4xl text-[#1F2A54] mb-12">{titleText}</h2>
        </Reveal>
        <div className="relative">
          <div className="absolute left-6 top-[22px] bottom-0 w-px -translate-x-1/2 bg-[#1F2A54]/15 md:left-1/2" />
          <div className="space-y-10">
            {items.map((item, index) => (
              <Reveal key={`${item.year}-${index}`} delay={index * 0.05}>
                <div className="relative md:grid md:grid-cols-2 md:gap-12">
                  <div
                    className={
                      index % 2 === 1
                        ? "pl-14 md:col-start-2 md:pl-12"
                        : "pl-14 md:pl-0 md:pr-12 md:text-right"
                    }
                  >
                    <div className="absolute left-6 top-1.5 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[#1F2A54] text-xs font-bold text-white md:left-1/2">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="text-[#DDA21A] font-semibold mb-1">{item.year}</p>
                    <h3 className="text-[#1F2A54] font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-[#6B7280] text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
