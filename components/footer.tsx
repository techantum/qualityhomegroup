"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Facebook, Linkedin, Youtube } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import type { ContactInfo } from "@/lib/firestore";
import { BrandingLogo } from "@/components/branding-logo";
import { useBranding } from "@/hooks/use-branding";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

const discoverLinks = [
  { href: "/apartments", label: "Apartments" },
  { href: "/villas", label: "Villas" },
  { href: "/commercial", label: "Commercial" },
  { href: "/plots", label: "Plots" },
];

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href || href === "#") return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-[#1F2A54]/10 flex items-center justify-center text-[#1F2A54] hover:bg-[#DDA21A] hover:text-white transition-all duration-300"
      aria-label={label}
    >
      {children}
    </a>
  );
}

export function Footer() {
  const { branding } = useBranding();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch("/api/v1/content/contact", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) setContactInfo(json.data);
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    }
    fetchContact();
  }, []);

  const address = contactInfo?.address?.trim();
  const phone = contactInfo?.phone?.trim();
  const email = contactInfo?.email?.trim();
  const social = contactInfo?.socialLinks;

  return (
    <footer>
      <div className="bg-[#F5F5F5] py-16">
        <div className="max-w-[1200px] mx-auto px-4">
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <StaggerItem>
              <Link href="/">
                <BrandingLogo
                  variant="footer"
                  width={56}
                  height={56}
                  className="mb-8 h-14 w-auto"
                />
              </Link>

              <div className="space-y-4">
                {address && (
                  <p className="text-sm text-[#1F2A54] whitespace-pre-line">{address}</p>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-sm text-[#1F2A54] font-medium hover:text-[#DDA21A] transition-colors">
                    {phone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="block text-sm text-[#1F2A54] font-medium hover:text-[#DDA21A] transition-colors">
                    {email}
                  </a>
                )}
                {!address && !phone && !email && (
                  <p className="text-sm text-muted-foreground">Contact details can be configured in the admin panel.</p>
                )}
              </div>
            </StaggerItem>

            <StaggerItem>
              <h4 className="font-semibold text-[#1F2A54] text-lg mb-6 underline underline-offset-4">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[#1F2A54] hover:text-[#DDA21A] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            <StaggerItem>
              <h4 className="font-semibold text-[#1F2A54] text-lg mb-6 underline underline-offset-4">Discover</h4>
              <ul className="space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-[#1F2A54] hover:text-[#DDA21A] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            <StaggerItem>
              <h4 className="font-semibold text-[#1F2A54] text-lg mb-6 underline underline-offset-4">Get Social</h4>
              <div className="flex items-center gap-3 flex-wrap">
                <SocialIcon href={social?.facebook || ""} label="Facebook">
                  <Facebook className="w-5 h-5" />
                </SocialIcon>
                <SocialIcon href={social?.twitter || ""} label="Twitter / X">
                  <span className="text-sm font-bold">X</span>
                </SocialIcon>
                <SocialIcon href={social?.linkedin || ""} label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </SocialIcon>
                <SocialIcon href={social?.youtube || ""} label="YouTube">
                  <Youtube className="w-5 h-5" />
                </SocialIcon>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </div>

      <div className="bg-[#2D3748] py-4">
        <div className="max-w-[1200px] mx-auto px-4">
          <p className="text-center text-sm text-white">© {new Date().getFullYear()} {branding.siteName} — All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
