"use client";

import { SafeImage } from "@/components/safe-image";
import { isValidImageUrl } from "@/lib/media";

export type CmsPageSection = {
  id?: string;
  title?: string;
  content?: string;
  image?: string;
};

export function CmsPageBody({
  content,
  sections,
}: {
  content?: unknown;
  sections?: unknown;
}) {
  const body = String(content ?? "").trim();
  const items = (Array.isArray(sections) ? sections : [])
    .map((section) => {
      const item = (section ?? {}) as CmsPageSection;
      return {
        id: String(item.id ?? ""),
        title: String(item.title ?? "").trim(),
        content: String(item.content ?? "").trim(),
        image: String(item.image ?? "").trim(),
      };
    })
    .filter((section) => section.title || section.content || isValidImageUrl(section.image));

  if (!body && items.length === 0) return null;

  return (
    <section className="bg-[#F5F5F5] py-12 md:py-16">
      <div className="mx-auto max-w-[1200px] space-y-10 px-4">
        {body && (
          <p className="mx-auto max-w-3xl whitespace-pre-line text-center text-[#6B7280] leading-relaxed">
            {body}
          </p>
        )}
        {items.map((section, index) => (
          <div
            key={section.id || `${section.title}-${index}`}
            className={`grid items-center gap-8 ${isValidImageUrl(section.image) ? "md:grid-cols-2" : ""}`}
          >
            {isValidImageUrl(section.image) && (
              <div className={`relative h-64 overflow-hidden rounded-2xl ${index % 2 === 1 ? "md:order-2" : ""}`}>
                <SafeImage src={section.image} alt={section.title || "Section image"} fill className="object-cover" />
              </div>
            )}
            <div>
              {section.title && (
                <h2 className="mb-3 font-royal text-2xl text-[#1F2A54] md:text-3xl">{section.title}</h2>
              )}
              {section.content && (
                <p className="whitespace-pre-line text-[#6B7280] leading-relaxed">{section.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
