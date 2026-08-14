export type HomeVideoContent = {
  title: string;
  videoUrl: string;
  posterImage: string;
};

export const DEFAULT_HOME_VIDEO: HomeVideoContent = {
  title: "Discover a place you'll love to live",
  videoUrl: "",
  posterImage: "",
};

export function normalizeHomeVideoContent(
  data: Partial<HomeVideoContent> | Record<string, unknown> | null | undefined
): HomeVideoContent {
  if (!data || typeof data !== "object") {
    return { ...DEFAULT_HOME_VIDEO };
  }
  const d = data as Record<string, unknown>;
  return {
    title:
      String(d.title ?? d.headline ?? DEFAULT_HOME_VIDEO.title).trim() ||
      DEFAULT_HOME_VIDEO.title,
    videoUrl: String(d.videoUrl ?? d.video ?? "").trim(),
    posterImage: String(
      d.posterImage ?? d.backgroundImage ?? d.heroImage ?? ""
    ).trim(),
  };
}

export function hasHomeVideoContent(content: HomeVideoContent): boolean {
  return Boolean(
    content.videoUrl.trim() ||
      content.posterImage.trim() ||
      content.title.trim()
  );
}
