"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { SiteScript } from "@/lib/firestore-types";
import { scriptAppliesToPath } from "@/lib/site-pages";

const MARKER = "data-qh-script-id";

function parseSnippet(content: string): Node[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  const html = looksLikeHtml ? trimmed : `<script>${trimmed}</script>`;
  const template = document.createElement("template");
  template.innerHTML = html;
  return Array.from(template.content.childNodes);
}

function injectScript(script: SiteScript) {
  if (!script.id) return;
  const parent = script.placement === "header" ? document.head : document.body;
  const nodes = parseSnippet(script.content);

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) continue;

    if (node.nodeName === "SCRIPT") {
      const source = node as HTMLScriptElement;
      const el = document.createElement("script");
      for (const attr of Array.from(source.attributes)) {
        el.setAttribute(attr.name, attr.value);
      }
      el.text = source.textContent ?? "";
      el.setAttribute(MARKER, script.id);
      parent.appendChild(el);
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node.cloneNode(true) as HTMLElement;
      el.setAttribute(MARKER, script.id);
      parent.appendChild(el);
      continue;
    }

    const wrap = document.createElement(script.placement === "header" ? "meta" : "span");
    wrap.setAttribute(MARKER, script.id);
    if (node.textContent) wrap.setAttribute("content", node.textContent);
    parent.appendChild(wrap);
  }
}

function removeInjected(id: string) {
  document
    .querySelectorAll(`[${MARKER}="${CSS.escape(id)}"]`)
    .forEach((node) => node.remove());
}

export function SiteScripts() {
  const pathname = usePathname();
  const scriptsRef = useRef<SiteScript[]>([]);
  const injectedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    let cancelled = false;
    fetch("/api/v1/scripts", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        scriptsRef.current = (json?.data ?? []) as SiteScript[];
        sync(window.location.pathname);
      })
      .catch((error) => {
        console.error("Failed to load site scripts:", error);
      });

    return () => {
      cancelled = true;
    };
    // Load once; pathname changes are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      for (const id of injectedRef.current) removeInjected(id);
      injectedRef.current.clear();
      return;
    }
    sync(pathname);
  }, [pathname]);

  function sync(path: string) {
    const matching = scriptsRef.current.filter(
      (script) => script.isActive && scriptAppliesToPath(script, path),
    );
    const matchingIds = new Set(matching.map((script) => script.id).filter(Boolean) as string[]);

    for (const id of Array.from(injectedRef.current)) {
      if (!matchingIds.has(id)) {
        removeInjected(id);
        injectedRef.current.delete(id);
      }
    }

    for (const script of matching) {
      if (!script.id || injectedRef.current.has(script.id)) continue;
      injectScript(script);
      injectedRef.current.add(script.id);
    }
  }

  return null;
}
