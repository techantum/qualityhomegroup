export type CompanyHistoryItem = {
  year: string;
  title: string;
  text: string;
};

export const DEFAULT_COMPANY_HISTORY: CompanyHistoryItem[] = [
  {
    year: "2019",
    title: "Formation of Company",
    text: "Founded by Mr. Ramesh Karutoori and incorporated Quality Home Group with a future vision.",
  },
  {
    year: "2020–23",
    title: "Residential & Commercial Development",
    text: "Launched a 28-acre premium plotting project in Patancheru, executed 2,50,000+ sft of residential developments in Manikonda, Hyderabad, and delivered commercial building projects in Manikonda.",
  },
  {
    year: "2024–25",
    title: "Acquired & Executed 16 Acres",
    text: "HMDA open-plot venture of 16 acres at Rudraram (Kandi IIT, Mumbai Highway).",
  },
  {
    year: "2025–26",
    title: "Land Bank for Villa Projects",
    text: "Acquired about 12 acres for premium villa projects: 7.05 acres at Muthangi and 4.7 acres at Mokila.",
  },
  {
    year: "2026",
    title: "Ongoing Residential Apartment Project",
    text: "Residential apartment project in Sangareddy spanning 5,445 sq. yards with about 1,40,000 sft.",
  },
];

export function normalizeCompanyHistory(raw: unknown): CompanyHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = (item || {}) as Record<string, unknown>;
      return {
        year: String(o.year ?? "").trim(),
        title: String(o.title ?? "").trim(),
        text: String(o.text ?? o.description ?? "").trim(),
      };
    })
    .filter((item) => item.year || item.title || item.text);
}
