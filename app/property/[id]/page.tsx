"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Play, MapPin, Phone, ChevronRight, Plus, Minus, X, ChevronLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import type { Project, PropertyDetails, PropertyAmenity } from "@/lib/firestore";

const navTabs = [
  { id: "overview", label: "Over view" },
  { id: "amenities", label: "Amenities" },
  { id: "floor-plan", label: "Floor Plan" },
  { id: "gallery", label: "Gallary" },
  { id: "location", label: "Location Advantages" },
  { id: "project-status", label: "Project Status" },
  { id: "specifications", label: "Specifications" },
  { id: "walkthrough", label: "Project video" },
  { id: "brochure", label: "brochure" },
];

/** Minimal 1x1 transparent data URI – used when no CMS image (avoids static placeholder files). */
const NO_IMAGE_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [amenities, setAmenities] = useState<PropertyAmenity[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePlanType, setActivePlanType] = useState("master");
  const [expandedSpec, setExpandedSpec] = useState<string | null>("structure");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeAmenity, setActiveAmenity] = useState<number | null>(null);
  const [hoveredAmenity, setHoveredAmenity] = useState<number | null>(null);
  const [floorPlanSlide, setFloorPlanSlide] = useState(0);
  const [mainGalleryOpen, setMainGalleryOpen] = useState(false);
  const [mainGalleryIndex, setMainGalleryIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isWalkThroughPlaying, setIsWalkThroughPlaying] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("0");
  const videoRef = useRef<HTMLVideoElement>(null);
  const walkThroughVideoRef = useRef<HTMLVideoElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const walkThroughSectionRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [notFound, setNotFound] = useState(false);



  // Handle video play/pause on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (videoRef.current && videoSectionRef.current && isVideoPlaying) {
        const rect = videoSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) {
          videoRef.current.pause();
          setIsVideoPlaying(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVideoPlaying]);

  const handleVideoClick = () => {
    if (isVideoPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsVideoPlaying(false);
    } else {
      setIsVideoPlaying(true);
    }
  };

  // Handle walk through video scroll pause
  useEffect(() => {
    const handleWalkThroughScroll = () => {
      if (walkThroughVideoRef.current && walkThroughSectionRef.current && isWalkThroughPlaying) {
        const rect = walkThroughSectionRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) {
          walkThroughVideoRef.current.pause();
          setIsWalkThroughPlaying(false);
        }
      }
    };

    window.addEventListener("scroll", handleWalkThroughScroll);
    return () => window.removeEventListener("scroll", handleWalkThroughScroll);
  }, [isWalkThroughPlaying]);

  const handleWalkThroughClick = () => {
    if (isWalkThroughPlaying) {
      if (walkThroughVideoRef.current) {
        walkThroughVideoRef.current.pause();
      }
      setIsWalkThroughPlaying(false);
    } else {
      setIsWalkThroughPlaying(true);
    }
  };

  // Gallery images from CMS (propertyDetails.galleryImages)
  const allGalleryImages: string[] = Array.isArray((propertyDetails as Record<string, unknown>)?.galleryImages)
    ? ((propertyDetails as Record<string, unknown>).galleryImages as string[])
    : [];

  const openMainGallery = (index: number) => {
    setMainGalleryIndex(index);
    setMainGalleryOpen(true);
  };

  const nextMainGalleryImage = () => {
    setMainGalleryIndex((prev) => (prev + 1) % allGalleryImages.length);
  };

  const prevMainGalleryImage = () => {
    setMainGalleryIndex((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length);
  };

  // Floor plan images from CMS (propertyDetails.floorPlans)
  const floorPlanImages: { src: string; alt: string }[] = (() => {
    const raw = (propertyDetails as Record<string, unknown>)?.floorPlans;
    if (!Array.isArray(raw)) return [];
    return raw.map((p: Record<string, unknown>) => ({
      src: String(p?.image ?? p?.src ?? ""),
      alt: String(p?.name ?? p?.alt ?? "Floor plan"),
    }));
  })();

  const nextFloorPlan = () => {
    setFloorPlanSlide((prev) => (prev + 1) % Math.max(1, floorPlanImages.length - 2));
  };

  const prevFloorPlan = () => {
    setFloorPlanSlide((prev) => (prev - 1 + Math.max(1, floorPlanImages.length - 2)) % Math.max(1, floorPlanImages.length - 2));
  };

  // Amenities from CMS only (no fallback)
  const amenitiesData = amenities.map((a) => ({
    name: a.name,
    image: a.image,
    galleryImages: Array.isArray(a.galleryImages) ? a.galleryImages : [],
  }));

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/v1/projects/public/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const data = json?.data;
        if (!res.ok || !data?.project) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const proj = data.project as Project & { id?: string; slug?: string };
        setProject(proj);
        if (data?.propertyDetails) {
          setPropertyDetails(data.propertyDetails as PropertyDetails);
        }
        if (Array.isArray(data?.propertyAmenities)) {
          setAmenities(data.propertyAmenities as PropertyAmenity[]);
        }
        if (proj?.slug && proj?.id && projectId === proj.id) {
          router.replace(`/property/${proj.slug}`, { scroll: false });
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  // Scroll spy: update activeTab based on which section is in view
  useEffect(() => {
    if (loading) return;
    const sectionIds = navTabs.map((t) => t.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const openGallery = (amenityIndex: number) => {
    setActiveAmenity(amenityIndex);
    setGalleryIndex(0);
    setGalleryOpen(true);
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setActiveAmenity(null);
  };

  const nextImage = () => {
    if (activeAmenity !== null) {
      const images = amenitiesData[activeAmenity].galleryImages;
      setGalleryIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (activeAmenity !== null) {
      const images = amenitiesData[activeAmenity].galleryImages;
      setGalleryIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Data from CMS only (no static fallbacks)
  const tagline = propertyDetails?.tagline ?? "";
  const price = propertyDetails?.price ?? "";
  const priceLabel = propertyDetails?.priceLabel ?? "";
  const reraNumber = propertyDetails?.reraNumber ?? "";
  const heroImage = propertyDetails?.heroImage || project?.image || "";
  const about = propertyDetails?.about ?? "";
  const stats = propertyDetails?.stats ?? null;
  const projectStatusVideo = propertyDetails?.videoUrl ?? "";
  const walkthroughVideoUrl = (propertyDetails as Record<string, unknown>)?.walkthroughVideoUrl ?? propertyDetails?.videoUrl ?? "";
  const brochureUrl = propertyDetails?.brochureUrl ?? "";
  const nearbyPlacesList = (propertyDetails?.location as { nearbyPlaces?: { name: string; distance: string; type: string }[] } | undefined)?.nearbyPlaces ?? [];
  const specificationsList = Array.isArray(propertyDetails?.specifications) ? propertyDetails.specifications : [];
  const mapUrl = (propertyDetails?.location as { mapUrl?: string } | undefined)?.mapUrl ?? "";
  // Group nearby places by type for display (CMS data only)
  const nearbyHospitals = nearbyPlacesList.filter((p) => /hospital|medical|health/i.test(p.type || ""));
  const nearbySchools = nearbyPlacesList.filter((p) => /school|college|education/i.test(p.type || ""));
  const nearbyItParks = nearbyPlacesList.filter((p) => /it|business|park|hub|tech/i.test(p.type || ""));
  const nearbyConnectivity = nearbyPlacesList.filter((p) => /connect|road|airport|exit|transport/i.test(p.type || ""));

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Specification tabs from CMS data only
  const specificationTabs = specificationsList.map((spec, i) => ({
    id: String(i),
    label: typeof spec === "object" && spec && "category" in spec ? String((spec as { category: string }).category) : `Section ${i + 1}`,
  }));
  const activeSpecContent = specificationTabs.length > 0 ? specificationsList[Number(activeSpecTab)] : null;

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-[#1F2A54]" />
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h1 className="text-2xl font-bold text-[#1F2A54] mb-2">Project not found</h1>
          <p className="text-gray-600 mb-6">The project you’re looking for doesn’t exist or has been removed.</p>
          <Link href="/">
            <Button className="bg-[#1F2A54] hover:bg-[#1F2A54]/90">Back to home</Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section - image from CMS only */}
      <section className="relative h-[300px] w-full overflow-hidden">
        {heroImage ? (
          <Image src={heroImage} alt={project.title} fill className="object-cover object-center" />
        ) : (
          <div className="absolute inset-0 bg-[#1F2A54]" aria-hidden />
        )}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-[1200px] mx-auto px-4 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
              {/* Left Content */}
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight mb-4 md:mb-6">
                  {tagline || project.title}
                </h1>
                
                {/* Price Card - from CMS only */}
                {(price || priceLabel) && (
                <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 inline-flex items-center gap-3 md:gap-4 max-w-full">
                  <div className="border-r border-gray-300 pr-3 md:pr-4 flex-shrink-0">
                    <span className="text-gray-600 text-xs md:text-sm">{priceLabel || "Price"}:</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1F2A54] font-bold text-lg sm:text-xl md:text-3xl truncate">{price ? `START AT ${price}*` : "Price on request"}</p>
                    <p className="text-gray-500 text-xs">*T&C APPLY</p>
                  </div>
                </div>
                )}
              </div>

              {/* Right - Property Info (hidden on very small screens, shown as column on mobile) */}
              <div className="flex-1 min-w-0 flex flex-col items-start md:items-end text-left md:text-right">
                <h3 className="font-bold text-white text-base md:text-xl mb-1">
                  {project.title}
                </h3>
                {project.price && (
                  <p className="text-[#DDA21A] text-sm md:text-lg mb-3 md:mb-4">{project.price}</p>
                )}
                
                {/* Status Badge */}
                {project.status && (
                  <div className="bg-[#DDA21A] text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full font-medium text-sm md:text-base mb-3 md:mb-4 capitalize">
                    Status: {project.status.replace(/_/g, " ")}
                  </div>
                )}
                
                {/* Location Badge */}
                <div className="bg-black rounded-lg px-3 md:px-4 py-2 md:py-3 mb-3 md:mb-4 max-w-full">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-[#DDA21A] rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm md:text-lg">{project.location || "—"}</p>
                      <p className="text-xs text-white/80 truncate">{(propertyDetails?.location as { address?: string } | undefined)?.address || ""}</p>
                    </div>
                  </div>
                </div>
                
                {/* RERA Number */}
                {reraNumber && (
                  <p className="text-white font-bold text-sm md:text-lg break-all">
                    {reraNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - from CMS only */}
      {stats && (
        <section className="py-12 bg-[#E8F4FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 text-center">
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">Total Land Area</p>
                <p className="text-[#1F2A54] text-lg">{stats.totalLandArea || "—"}</p>
              </div>
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">No.of Blocks</p>
                <p className="text-[#1F2A54] text-lg">{stats.noOfBlocks || "—"}</p>
              </div>
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">Total Units</p>
                <p className="text-[#1F2A54] text-lg">{stats.totalUnits || "—"}</p>
              </div>
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">Configuration</p>
                <p className="text-[#1F2A54] text-lg">{stats.configuration || "—"}</p>
              </div>
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">Floors</p>
                <p className="text-[#1F2A54] text-lg">{stats.floors || "—"}</p>
              </div>
              <div>
                <p className="text-[#1F2A54] font-bold text-base mb-1">Possession Starts</p>
                <p className="text-[#1F2A54] text-lg">{stats.possessionStarts || "—"}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs - sticky below the fixed header */}
      <div
        className="bg-white border-b border-gray-200 sticky top-[72px] lg:top-[108px] z-40 shadow-sm"
      >
        <div className="max-w-[1200px] mx-auto px-2 md:px-4">
          <div className="-mx-2 px-2 overflow-x-auto py-3" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <nav className="flex items-center gap-4 md:gap-8 min-w-max mx-auto w-fit">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 px-1 py-1 ${
                    activeTab === tab.id
                      ? "text-[#1F2A54] border-b-2 border-[#1F2A54]"
                      : "text-[#1F2A54] hover:text-[#DDA21A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* About Project */}
      <section id="overview" className="py-16 bg-white scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Content - 65% width */}
            <div className="md:w-[65%]">
              <h2 className="font-bold text-2xl md:text-3xl text-[#1F2A54] mb-6 inline-block">
                ABOUT PROJECT
                <span className="block w-16 h-0.5 bg-[#DDA21A] mt-2"></span>
              </h2>
              <div className="text-gray-600 leading-relaxed space-y-4 text-justify whitespace-pre-line">
                {about || ""}
              </div>
            </div>
            {/* Right Image - from CMS only */}
            {(heroImage && (
            <div className="md:w-[35%]">
              <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-lg">
                <Image src={heroImage} alt="About Project" fill className="object-cover" />
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-16 bg-white scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-bold text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Project Amenities
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
            Amenities for this project (from CMS).
          </p>
          
          {amenitiesData.length === 0 ? (
            <p className="text-center text-gray-500">No amenities added in CMS for this project.</p>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {amenitiesData.map((amenity, index) => {
              const isHovered = hoveredAmenity === index;
              return (
                <div 
                  key={index} 
                  className="relative h-[140px] sm:h-[180px] rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => openGallery(index)}
                  onMouseEnter={() => setHoveredAmenity(index)}
                  onMouseLeave={() => setHoveredAmenity(null)}
                >
                  {amenity.image ? (
                    <Image
                      src={amenity.image}
                      alt={amenity.name}
                      fill
                      className={`object-cover transition-all duration-500 ${isHovered ? "scale-105" : "grayscale"}`}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#E8F4FA] flex items-center justify-center text-[#1F2A54] text-sm font-medium" aria-hidden />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Expand icon - appears on hover */}
                  <div 
                    className={`absolute top-3 right-3 w-8 h-8 bg-[#DDA21A] rounded-md flex items-center justify-center transition-all duration-300 ${
                      isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="2" 
                      className="w-4 h-4"
                    >
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm">{amenity.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* Gallery Popup Modal - only when amenity has gallery images */}
      {galleryOpen && activeAmenity !== null && amenitiesData[activeAmenity]?.galleryImages?.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button 
            onClick={closeGallery}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          <button 
            onClick={prevImage}
            className="absolute left-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Image */}
          <div className="relative w-full max-w-4xl h-[70vh] mx-4">
            <Image
              src={amenitiesData[activeAmenity].galleryImages[galleryIndex] || NO_IMAGE_SRC}
              alt={amenitiesData[activeAmenity].name}
              fill
              className="object-contain"
            />
          </div>

          {/* Next Button */}
          <button 
            onClick={nextImage}
            className="absolute right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Title and Counter */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <h3 className="text-white text-xl font-semibold mb-2">{amenitiesData[activeAmenity].name}</h3>
            <p className="text-white/70">{galleryIndex + 1} / {amenitiesData[activeAmenity].galleryImages.length}</p>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {amenitiesData[activeAmenity].galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setGalleryIndex(idx)}
                className={`relative w-16 h-12 rounded overflow-hidden border-2 ${galleryIndex === idx ? "border-[#DDA21A]" : "border-transparent"}`}
              >
                <Image
                  src={img || NO_IMAGE_SRC}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floor Plan - always show section; content from CMS */}
      <section id="floor-plan" className="py-16 bg-[#E8F4FA] scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-medium text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Floor Plan
          </h2>
          {floorPlanImages.length > 0 ? (
            <div className="relative">
              <button onClick={prevFloorPlan} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform duration-300 bg-white/90 rounded-full shadow" aria-label="Previous">
                <ChevronLeft className="w-8 h-8 text-[#1F2A54]" />
              </button>
              <div className="overflow-hidden px-8">
                <div className="flex gap-6 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${floorPlanSlide * (100 / 3 + 2)}%)` }}>
                  {floorPlanImages.map((plan, index) => (
                    <div key={index} className="relative h-[200px] sm:h-[280px] md:h-[320px] rounded-lg overflow-hidden cursor-pointer group flex-shrink-0 bg-[#f0f0f0]" style={{ width: "min(calc(33.333% - 16px), 300px)", minWidth: "200px" }}>
                      {plan.src ? <Image src={plan.src} alt={plan.alt} fill className="object-contain transition-all duration-500 group-hover:scale-105" /> : <span className="absolute inset-0 flex items-center justify-center text-[#666] text-sm">No image</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={nextFloorPlan} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform duration-300 bg-white/90 rounded-full shadow" aria-label="Next">
                <ChevronRight className="w-8 h-8 text-[#1F2A54]" />
              </button>
            </div>
          ) : (
            <p className="text-center text-[#666666] py-8">No floor plans added yet. Add in Admin → Project Details → Floor Plan.</p>
          )}
        </div>
      </section>

      {/* Gallery - always show section; content from CMS */}
      <section id="gallery" className="py-16 bg-white scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-medium text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Gallery
          </h2>
          {allGalleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allGalleryImages.map((src, index) => (
                <div key={`gallery-${index}`} className="relative h-[180px] rounded-xl overflow-hidden group cursor-pointer bg-[#f0f0f0]" onClick={() => openMainGallery(index)}>
                  {src ? <Image src={src} alt={`Gallery ${index + 1}`} fill className="object-cover transition-all duration-500 group-hover:scale-110" /> : <span className="absolute inset-0 flex items-center justify-center text-[#666] text-sm">No image</span>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#666666] py-8">No gallery images added yet. Add in Admin → Project Details → Gallery.</p>
          )}
        </div>
      </section>

      {/* Near By Location - from CMS */}
      <section id="location" className="py-16 bg-white scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Location &amp; Nearby
          </h2>
          <p className="text-center text-[#666666] text-sm mb-10 max-w-3xl mx-auto">
            {((propertyDetails?.location as { address?: string })?.address) || `Explore ${project.title} and surrounding area.`}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left Side - 40% */}
            <div className="w-full md:w-[40%] bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="space-y-4">
                {nearbyHospitals.length > 0 && (
                  <div>
                    <h3 className="text-[#1F2A54] font-bold text-base mb-2">Hospitals</h3>
                    {nearbyHospitals.map((place, i) => (
                      <div key={i} className="flex justify-between text-[#666666] text-sm py-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[#666666]">•</span>
                          {place.name}
                        </span>
                        <span className="text-[#666666]">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                )}
                {nearbySchools.length > 0 && (
                  <div>
                    <h3 className="text-[#1F2A54] font-bold text-base mb-2">Schools & Colleges</h3>
                    {nearbySchools.map((place, i) => (
                      <div key={i} className="flex justify-between text-[#666666] text-sm py-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[#666666]">•</span>
                          {place.name}
                        </span>
                        <span className="text-[#666666]">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                )}
                {nearbyItParks.length > 0 && (
                  <div>
                    <h3 className="text-[#1F2A54] font-bold text-base mb-2">IT & Business Hubs</h3>
                    {nearbyItParks.map((place, i) => (
                      <div key={i} className="flex justify-between text-[#666666] text-sm py-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[#666666]">•</span>
                          {place.name}
                        </span>
                        <span className="text-[#666666]">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                )}
                {nearbyConnectivity.length > 0 && (
                  <div>
                    <h3 className="text-[#1F2A54] font-bold text-base mb-2">Road Connectivity</h3>
                    {nearbyConnectivity.map((place, i) => (
                      <div key={i} className="flex justify-between text-[#666666] text-sm py-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[#666666]">•</span>
                          {place.name}
                        </span>
                        <span className="text-[#666666]">{place.distance}</span>
                      </div>
                    ))}
                  </div>
                )}
                {nearbyPlacesList.length === 0 && (
                  <p className="text-[#666666] text-sm">No nearby places data from CMS.</p>
                )}
              </div>
            </div>
            
            {/* Right Side - Map from CMS */}
            <div className="w-full md:w-[60%] relative min-h-[550px] rounded-2xl overflow-hidden bg-[#E8E8E8] border border-gray-100">
              {mapUrl ? (
                <iframe
                  src={mapUrl}
                  title="Location map"
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#666666]">
                  No map URL in CMS
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Project Status - video from CMS */}
      <section id="project-status" ref={videoSectionRef} className="py-16 relative min-h-[300px] scroll-mt-[120px] lg:scroll-mt-[160px] bg-[#1F2A54]">
        <div className="absolute inset-0 bg-[#1F2A54]" aria-hidden />
        <div className="relative z-10 max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-white text-center mb-4">
            Project Status
          </h2>
          {projectStatusVideo ? (
            <div className="relative aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm">
              <iframe
                src={projectStatusVideo}
                title="Project status video"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-center text-white/80 py-8">No project status video added yet. Add in Admin → Project Details → Project Status.</p>
          )}
        </div>
      </section>

      {/* Specifications - always show section; content from CMS */}
      <section id="specifications" className="py-16 bg-[#F5F5F5] scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Specifications
          </h2>
          {specificationsList.length > 0 ? (
            <>
              <p className="text-center text-[#666666] text-sm mb-10 max-w-3xl mx-auto">
                Project specifications from CMS.
              </p>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-[35%] pr-0 md:pr-8 border-b md:border-b-0 md:border-r border-gray-300 pb-4 md:pb-0">
                  <div className="flex flex-wrap md:flex-col gap-1 md:gap-0 md:space-y-1">
                    {specificationTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSpecTab(tab.id)}
                        className={`w-full text-left py-2 flex items-start gap-2 transition-colors ${
                          activeSpecTab === tab.id ? "text-[#DDA21A]" : "text-[#1F2A54]"
                        }`}
                      >
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-current flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {tab.label}
                          {tab.sublabel && <span className="block">{tab.sublabel}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-[65%] pl-0 md:pl-8 mt-8 md:mt-0">
                  {activeSpecContent && (
                    <div className="space-y-4">
                      {Array.isArray((activeSpecContent as { items?: string[] }).items) &&
                        ((activeSpecContent as { items: string[] }).items).map((item, idx) => (
                          <p key={idx} className="text-[#666666] text-sm flex items-start gap-2">
                            <span className="mt-1.5">•</span>
                            <span>{item}</span>
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-[#666666] py-8">No specifications added yet. Add in Admin → Project Details → Specifications.</p>
          )}
        </div>
      </section>

      {/* Project video - always show section; content from CMS */}
      <section id="walkthrough" className="py-16 bg-white scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1F2A54] text-center mb-4">
            Project video
          </h2>
          {walkthroughVideoUrl ? (
            <>
              <p className="text-center text-[#666666] text-sm mb-10 max-w-3xl mx-auto">
                Watch the walkthrough of this project.
              </p>
              <div className="relative aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden bg-black/10">
                <iframe
                  src={walkthroughVideoUrl}
                  title="Project walkthrough video"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </>
          ) : (
            <p className="text-center text-[#666666] py-8">No project video added yet. Add in Admin → Project Details → Project video.</p>
          )}
        </div>
      </section>

      {/* Brochure - always show section; content from CMS */}
      <section id="brochure" className="py-16 bg-[#F5F5F5] scroll-mt-[120px] lg:scroll-mt-[160px]">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-[#1F2A54] mb-4">
            Brochure
          </h2>
          {brochureUrl ? (
            <>
              <p className="text-[#666666] text-sm mb-8 max-w-2xl mx-auto">
                Download or view the project brochure.
              </p>
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#1F2A54] hover:bg-[#1F2A54]/90 text-white font-medium px-8 py-4 rounded-lg transition-colors"
              >
                View / Download Brochure <ChevronRight className="w-4 h-4" />
              </a>
            </>
          ) : (
            <p className="text-[#666666] py-8">No brochure link added yet. Add in Admin → Project Details → Brochure.</p>
          )}
        </div>
      </section>

      <Footer />

      {/* Main Gallery Popup Modal - only when gallery has images */}
      {allGalleryImages.length > 0 && mainGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setMainGalleryOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous Button */}
          <button
            onClick={prevMainGalleryImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Main Image */}
          <div className="relative w-full max-w-4xl h-[70vh] mx-4 md:mx-16">
            <Image
              src={allGalleryImages[mainGalleryIndex] || NO_IMAGE_SRC}
              alt={`Gallery ${mainGalleryIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Next Button */}
          <button
            onClick={nextMainGalleryImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2">
            {allGalleryImages.map((src, index) => (
              <button
                key={index}
                onClick={() => setMainGalleryIndex(index)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                  index === mainGalleryIndex ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={src || NO_IMAGE_SRC}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {mainGalleryIndex + 1} / {allGalleryImages.length}
          </div>
        </div>
      )}
    </main>
  );
}
