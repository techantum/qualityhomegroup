"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnquiryModal } from "@/components/enquiry-modal";
import { BrandingLogo } from "@/components/branding-logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/apartments", label: "Apartments" },
  { href: "/villas", label: "Villas" },
  { href: "/commercial", label: "Commercial" },
  { href: "/plots", label: "Plots" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [mobileMenuOpen]);

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-50 bg-white shadow-sm pt-[env(safe-area-inset-top)]">
      <div
        className="mx-auto w-full max-w-[1200px] px-4"
        style={{
          paddingTop: "var(--site-navbar-padding-y)",
          paddingBottom: "var(--site-navbar-padding-y)",
        }}
      >
        {/* Desktop */}
        <div className="hidden lg:flex w-full items-center gap-8">
          <Link href="/" className="inline-flex shrink-0">
            <BrandingLogo variant="header" priority />
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-end gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 text-sm font-medium transition-colors duration-200 nav-hover cursor-pointer relative pb-1 ${
                  isActive(link.href)
                    ? "text-[#DDA21A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#DDA21A]"
                    : "text-[#1F2A54] hover:text-[#DDA21A]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button
              className="ml-2 cursor-pointer rounded-md bg-[#1F2A54] px-6 py-2 font-medium text-white transition-all duration-300 btn-hover-lift hover:bg-[#1F2A54]/90"
              onClick={() => setIsEnquiryOpen(true)}
            >
              Enquire Now
            </Button>
          </nav>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <div className="relative flex items-center justify-between gap-2">
            <Link href="/" className="inline-flex shrink-0">
              <BrandingLogo variant="header" priority />
            </Link>

            <div className="flex items-center gap-1">
              <Button
                className="h-9 rounded-md bg-[#1F2A54] px-3 text-xs font-medium text-white hover:bg-[#1F2A54]/90"
                onClick={() => setIsEnquiryOpen(true)}
              >
                Enquire Now
              </Button>
              <button
                type="button"
                className="p-2 text-[#1F2A54] transition-colors duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden bg-white"
              >
                <nav className="flex max-h-[calc(100dvh-var(--site-header-height)-env(safe-area-inset-top))] flex-col gap-1 overflow-y-auto pb-4 pt-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`w-full rounded-md px-3 py-3 text-center text-base transition-colors duration-200 ${
                        isActive(link.href)
                          ? "bg-[#1F2A54]/5 font-semibold text-[#DDA21A]"
                          : "text-[#1F2A54] hover:bg-[#1F2A54]/5 hover:text-[#DDA21A]"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Button
                    className="mx-auto mt-2 w-full max-w-xs bg-[#DDA21A] font-medium text-[#1F2A54] transition-all duration-300 hover:bg-[#c99218]"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsEnquiryOpen(true);
                    }}
                  >
                    Enquire Now
                  </Button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </header>
  );
}
