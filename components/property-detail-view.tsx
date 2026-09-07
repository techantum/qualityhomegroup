"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  MapPin,
  Play,
  Ruler,
  Shield,
  X,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EnquiryModal } from "@/components/enquiry-modal";
import { SafeImage } from "@/components/safe-image";
import { Button } from "@/components/ui/button";
import {
  asStringArray,
  asSpecs,
  asStats,
  enquiryProjectType,
  firstText,
  nearbyPlacesToArray,
  projectListingHref,
  projectStatusLabel,
  projectTypeLabel,
  type NearbyPlace,
  type ProjectPageItem,
} from "@/lib/project-page";

type AmenityItem = {
  id?: string;
  name: string;
  image?: string | null;
  galleryImages?: string[];
};

type Props = {
  project: ProjectPageItem;
  propertyDetails: Record<string, unknown> | null;
  amenities: AmenityItem[];
  related: ProjectPageItem[];
};

export function PropertyDetailView({ project, propertyDetails, amenities, related }: Props) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeSpec, setActiveSpec] = useState(0);

  const details = propertyDetails ?? {};
  const typeLabel = projectTypeLabel(project.type, project.category);
  const listingHref = projectListingHref(project.type, project.category);
  const statusLabel = projectStatusLabel(project.status);
  const heroImage = firstText(details.heroImage, project.image);
  const aboutImage = firstText(details.aboutImage);
  const tagline = firstText(details.tagline);
  const about = firstText(details.about, project.description);
  const price = firstText(details.price, project.price);
  const priceLabel = firstText(details.priceLabel) || "Price";
  const reraNumber = firstText(details.reraNumber);
  const brochureUrl = firstText(details.brochureUrl);
  const videoUrl = firstText(details.videoUrl, details.projectStatusVideo);
  const walkthroughUrl = firstText(details.walkthroughVideoUrl, details.walkThroughVideo);
  const locationData = (details.location as { address?: string; mapUrl?: string; image?: string; nearbyPlaces?: NearbyPlace[] } | undefined) ?? {};
  const address = firstText(locationData.address, project.location);
  const mapUrl = firstText(locationData.mapUrl);
  const locationImage = firstText(locationData.image, details.locationImage);
  const nearby = nearbyPlacesToArray(locationData.nearbyPlaces).length
    ? nearbyPlacesToArray(locationData.nearbyPlaces)
    : nearbyPlacesToArray(details.nearbyPlaces);
  const specs = asSpecs(details.specifications);
  const stats = asStats(details.stats);
  const highlightItems = asStringArray(details.highlights);
  const galleryImages = useMemo(
    () => Array.from(new Set(asStringArray(details.galleryImages).filter(Boolean))),
    [details.galleryImages],
  );
  const floorPlans = Array.isArray(details.floorPlans)
    ? (details.floorPlans as { name?: string; image?: string }[])
        .map((plan) => ({ name: String(plan?.name || "Floor plan"), image: String(plan?.image || "") }))
        .filter((plan) => plan.image)
    : [];
  const amenityItems = amenities.filter((item) => item?.name);

  const statItems = [
    { label: "Land / scale", value: stats.totalLandArea, icon: Ruler },
    { label: "Configuration", value: stats.configuration, icon: LayoutGrid },
    { label: "Units / plots", value: stats.totalUnits, icon: Building2 },
    { label: "Possession", value: stats.possessionStarts, icon: CalendarDays },
  ].filter((item) => item.value && item.value !== "—");

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="relative min-h-[70vh] w-full overflow-hidden md:min-h-[78vh]" style={{ minHeight: `max(70vh, calc(var(--site-header-height) + 360px))` }}>
        {heroImage ? (
          <SafeImage src={heroImage} alt={project.title} fill priority className="object-cover object-center" />
        ) : (
          <div className="absolute inset-0 bg-[#1F2A54]" />
        )}
        <div className="absolute inset-0 bg-[#1F2A54]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2A54] via-[#1F2A54]/25 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-[1200px] flex-col justify-end px-4 pb-10 pt-28 md:min-h-[78vh] md:pb-16 md:pt-32">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
            <Link href="/" className="hover:text-[#DDA21A]">Home</Link>
            <span>/</span>
            <Link href={listingHref} className="hover:text-[#DDA21A]">{typeLabel}</Link>
            <span>/</span>
            <span className="line-clamp-1 text-white">{project.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
              {typeLabel}
            </span>
            {statusLabel && (
              <span className="rounded-full bg-[#DDA21A] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {statusLabel}
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight max-w-4xl">
            {project.title}
          </h1>
          {tagline && (
            <p className="mt-3 max-w-2xl text-base md:text-lg text-white/85">{tagline}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#DDA21A]" />
              <span>{project.location}</span>
            </div>
            {(price || project.price) && (
              <div className="text-[#DDA21A] font-semibold">
                {priceLabel}: {price || project.price}
              </div>
            )}
            {reraNumber && <div className="text-white/80 text-sm">{reraNumber}</div>}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => setEnquiryOpen(true)}
              className="bg-[#DDA21A] hover:bg-[#c49217] text-white px-6 h-11"
            >
              Enquire Now
            </Button>
            {brochureUrl && (
              <Button asChild variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-[#1F2A54] h-11">
                <a href={brochureUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2 h-4 w-4" />
                  Brochure
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white hover:text-[#1F2A54] h-11">
              <Link href={listingHref}>Back to {typeLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      {statItems.length > 0 && (
        <section className="bg-[#F4F7FB] border-b border-[#1F2A54]/10">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
            {statItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F2A54]/10 text-[#1F2A54]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="font-semibold text-[#1F2A54]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {about && (
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Overview</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">About this project</h2>
            <div className="mt-2 h-0.5 w-16 bg-[#DDA21A]" />
            <div className="mt-6 space-y-4 whitespace-pre-line text-gray-600 leading-relaxed">
              {about}
            </div>
          </div>
          {aboutImage && (
            <div className="relative h-[240px] overflow-hidden rounded-2xl shadow-lg sm:h-[360px] md:h-[440px]">
              <SafeImage src={aboutImage} alt={`${project.title} overview`} fill className="object-cover" />
            </div>
          )}
        </div>
      </section>
      )}

      {highlightItems.length > 0 && (
      <section className="bg-[#1F2A54] py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Highlights</p>
          <h2 className="mt-2 font-serif text-3xl text-white">Why this project</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlightItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-white/5 px-4 py-4">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DDA21A] text-white">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {galleryImages.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Gallery</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Project images</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => openGallery(index)}
                  className={`relative overflow-hidden rounded-2xl ${index === 0 && galleryImages.length > 1 ? "sm:col-span-2 lg:col-span-2 min-h-[220px] sm:min-h-[320px]" : "min-h-[200px] sm:min-h-[240px]"}`}
                >
                  <SafeImage src={src} alt={`${project.title} gallery ${index + 1}`} fill className="object-cover transition-transform duration-500 hover:scale-105" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {amenityItems.length > 0 && (
        <section className="bg-[#F4F7FB] py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Lifestyle</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Amenities</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {amenityItems.map((amenity) => (
                <div key={amenity.id || amenity.name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative h-36">
                    {amenity.image ? (
                      <SafeImage src={amenity.image} alt={amenity.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#1F2A54]/5 text-[#1F2A54]">
                        <Shield className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="px-4 py-3 font-medium text-[#1F2A54]">{amenity.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {floorPlans.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Plans</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Floor plans</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {floorPlans.map((plan) => (
                <div key={plan.image} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="relative h-72">
                    <SafeImage src={plan.image} alt={plan.name} fill className="object-contain bg-[#F4F7FB]" />
                  </div>
                  <p className="px-4 py-3 font-medium text-[#1F2A54]">{plan.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(address || nearby.length > 0 || mapUrl || locationImage) && (
      <section className="bg-[#F4F7FB] py-16 md:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Location</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Location advantages</h2>
            {address && (
              <div className="mt-5 flex items-start gap-3 text-[#1F2A54]">
                <MapPin className="mt-1 h-5 w-5 text-[#DDA21A]" />
                <p className="text-lg font-medium">{address}</p>
              </div>
            )}
            <div className="mt-6 space-y-3">
              {nearby.map((place) => (
                <div key={`${place.name}-${place.distance}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="text-[#1F2A54]">{place.name}</span>
                  <span className="text-sm text-gray-500">{place.distance}</span>
                </div>
              ))}
            </div>
          </div>
          {(locationImage || mapUrl) && (
          <div className="min-h-[360px] overflow-hidden rounded-2xl bg-[#1F2A54]/5">
            {locationImage ? (
              <div className="relative h-full min-h-[360px]">
                <SafeImage src={locationImage} alt={`${project.title} location`} fill className="object-cover" />
              </div>
            ) : (
              <iframe title={`${project.title} map`} src={mapUrl} className="h-full min-h-[360px] w-full border-0" loading="lazy" />
            )}
          </div>
          )}
        </div>
        {locationImage && mapUrl && (
          <div className="mx-auto mt-8 max-w-[1200px] overflow-hidden rounded-2xl px-4">
            <iframe title={`${project.title} map`} src={mapUrl} className="h-[360px] w-full border-0" loading="lazy" />
          </div>
        )}
      </section>
      )}

      {specs.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Details</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Specifications</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {specs.map((spec, index) => (
                <button
                  key={spec.category}
                  type="button"
                  onClick={() => setActiveSpec(index)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeSpec === index ? "bg-[#1F2A54] text-white" : "bg-[#F4F7FB] text-[#1F2A54] hover:bg-[#1F2A54]/10"
                  }`}
                >
                  {spec.category}
                </button>
              ))}
            </div>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {(specs[activeSpec] || specs[0]).items.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-gray-100 px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#DDA21A]" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {(videoUrl || walkthroughUrl) && (
        <section className="bg-[#F4F7FB] py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Walkthrough</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Project video</h2>
            <div className="mt-8 overflow-hidden rounded-2xl bg-black">
              <div className="relative aspect-video">
                {/youtube|youtu\.be|vimeo/.test(videoUrl || walkthroughUrl) ? (
                  <iframe
                    title={`${project.title} video`}
                    src={videoUrl || walkthroughUrl}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls className="h-full w-full">
                    <source src={videoUrl || walkthroughUrl} />
                  </video>
                )}
                <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 p-2 text-white">
                  <Play className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#1F2A54] py-14">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-3xl text-white">Interested in {project.title}?</h2>
            <p className="mt-2 text-white/80">Share your details and our team will get back to you with the latest information.</p>
          </div>
          <Button onClick={() => setEnquiryOpen(true)} className="bg-[#DDA21A] hover:bg-[#c49217] text-white h-11 px-6">
            Enquire about this project
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#DDA21A]">Explore more</p>
            <h2 className="mt-2 font-serif text-3xl text-[#1F2A54]">Related projects</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} href={`/property/${item.slug || item.id}`} className="group block overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <div className="relative h-56">
                    <SafeImage src={item.image} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#1F2A54] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <Button onClick={() => setEnquiryOpen(true)} className="h-11 w-full bg-[#DDA21A] hover:bg-[#c49217] text-white">
          Enquire Now
        </Button>
      </div>

      {galleryOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button type="button" onClick={() => setGalleryOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white" aria-label="Close gallery">
            <X className="h-6 w-6" />
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setGalleryIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setGalleryIndex((index) => (index + 1) % galleryImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative h-[70vh] w-[92vw] max-w-5xl">
            <SafeImage src={galleryImages[galleryIndex]} alt={`${project.title} image ${galleryIndex + 1}`} fill className="object-contain" />
          </div>
        </div>
      )}

      <div className="h-16 md:hidden" />
      <Footer />
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        projectName={project.title}
        defaultProjectType={enquiryProjectType(project.type, project.category)}
      />
    </main>
  );
}
