"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const headerSpring = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.85 };

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isScrolled) setMobileMenuOpen(false);
  }, [isScrolled]);

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors duration-300 nav-hover cursor-pointer relative pb-1 ${
      isActive(href)
        ? "text-[#DDA21A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#DDA21A]"
        : isScrolled
          ? "text-[#1F2A54] hover:text-[#DDA21A]"
          : "text-white hover:text-gold"
    }`;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "bg-white/95 shadow-md backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4">
        {/* Desktop */}
        <motion.div
          className="hidden lg:flex w-full items-center"
          initial={false}
          animate={{
            flexDirection: isScrolled ? "row" : "column",
            paddingTop: isScrolled ? 10 : 16,
            paddingBottom: isScrolled ? 10 : 16,
            gap: isScrolled ? 24 : 8,
          }}
          transition={headerSpring}
        >
          <motion.div
            layout
            layoutId="header-logo"
            className="flex shrink-0"
            transition={headerSpring}
            animate={{
              width: isScrolled ? "auto" : "100%",
              justifyContent: isScrolled ? "flex-start" : "center",
            }}
          >
            <Link href="/" className="inline-flex">
              <motion.div
                layout
                animate={{
                  height: isScrolled ? 36 : 48,
                }}
                transition={headerSpring}
                className="flex items-center"
              >
                <BrandingLogo
                  variant="header"
                  width={isScrolled ? 96 : 120}
                  height={isScrolled ? 36 : 48}
                  className="h-auto w-auto max-h-full"
                  priority
                />
              </motion.div>
            </Link>
          </motion.div>

          <motion.nav
            layout
            className={`flex min-w-0 flex-1 items-center gap-6 ${
              isScrolled ? "justify-end" : "w-full justify-center"
            }`}
            transition={headerSpring}
          >
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            <Button
              className="ml-2 cursor-pointer rounded-md bg-[#1F2A54] px-6 py-2 font-medium text-white transition-all duration-300 btn-hover-lift hover:bg-[#1F2A54]/90"
              onClick={() => setIsEnquiryOpen(true)}
            >
              Enquiry Now
            </Button>
          </motion.nav>
        </motion.div>

        {/* Mobile */}
        <motion.div
          className="lg:hidden"
          initial={false}
          animate={{
            paddingTop: isScrolled ? 8 : 16,
            paddingBottom: isScrolled ? 8 : 16,
          }}
          transition={headerSpring}
        >
          <div className="relative flex items-center">
            <motion.div
              layout
              layoutId="header-logo-mobile"
              className="flex shrink-0"
              animate={{
                marginLeft: isScrolled ? 0 : "auto",
                marginRight: isScrolled ? 0 : "auto",
              }}
              transition={headerSpring}
            >
              <Link href="/" className="inline-flex">
                <motion.div
                  animate={{ height: isScrolled ? 32 : 40 }}
                  transition={headerSpring}
                  className="flex items-center"
                >
                  <BrandingLogo
                    variant="header"
                    width={isScrolled ? 88 : 100}
                    height={isScrolled ? 32 : 40}
                    className="h-auto w-auto max-h-full"
                    priority
                  />
                </motion.div>
              </Link>
            </motion.div>

            <button
              type="button"
              className={`absolute right-0 p-2 transition-colors duration-300 ${
                isScrolled ? "text-[#1F2A54]" : "text-white"
              } ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`}
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
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`overflow-hidden ${isScrolled ? "bg-white" : "bg-[#1F2A54]/95"}`}
              >
                <nav className="flex flex-col items-center gap-1 pb-4 pt-2">
                  {navLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`w-full px-3 py-2.5 text-center text-sm transition-all duration-200 hover:bg-white/10 ${
                        isActive(link.href)
                          ? "font-semibold text-[#DDA21A]"
                          : isScrolled
                            ? "text-[#1F2A54] hover:bg-[#1F2A54]/5 hover:text-[#DDA21A]"
                            : "text-white hover:text-gold"
                      }`}
                      style={{ transitionDelay: `${index * 30}ms` }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Button
                    className="mt-2 w-[80%] bg-[#DDA21A] font-medium text-[#1F2A54] transition-all duration-300 hover:bg-[#c99218]"
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
        </motion.div>
      </div>

      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </motion.header>
  );
}
