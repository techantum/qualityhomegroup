"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnquiryModal } from "@/components/enquiry-modal";
import { BrandingLogo } from "@/components/branding-logo";
import { SITE_NAVBAR_PADDING_Y_PX } from "@/lib/site-layout";

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div
        className="mx-auto w-full max-w-[1200px] px-4"
        style={{
          paddingTop: SITE_NAVBAR_PADDING_Y_PX,
          paddingBottom: SITE_NAVBAR_PADDING_Y_PX,
        }}
      >
        {/* Desktop */}
        <div className="hidden lg:flex w-full items-center gap-8">
          <Link href="/" className="inline-flex shrink-0">
            <BrandingLogo variant="header" priority />
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-end gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 nav-hover cursor-pointer relative pb-1 ${
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
              Enquiry Now
            </Button>
          </nav>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <div className="relative flex items-center justify-between">
            <Link href="/" className="inline-flex shrink-0">
              <BrandingLogo variant="header" priority />
            </Link>

            <button
              type="button"
              className="p-2 text-[#1F2A54] transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
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
                <nav className="flex flex-col gap-1 pb-2 pt-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`w-full px-3 py-2.5 text-center text-sm transition-colors duration-200 ${
                        isActive(link.href)
                          ? "font-semibold text-[#DDA21A]"
                          : "text-[#1F2A54] hover:bg-[#1F2A54]/5 hover:text-[#DDA21A]"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Button
                    className="mx-auto mt-2 w-[80%] bg-[#DDA21A] font-medium text-[#1F2A54] transition-all duration-300 hover:bg-[#c99218]"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsEnquiryOpen(true);
                    }}
                  >
                    Enquiry Now
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
