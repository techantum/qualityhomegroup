"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGalleryImages } from "@/lib/firestore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ListingHero } from "@/components/listing-hero";
import { SafeImage } from "@/components/safe-image";
import { usePageContent } from "@/hooks/use-page-content";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";

// Project type with multiple images
interface ProjectGallery {
  id: string;
  title: string;
  thumbnail: string;
  images: string[];
  category: string;
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<ProjectGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectGallery | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: pageContent, loading: pageLoading } = usePageContent("gallery");

  useEffect(() => {
    async function fetchGallery() {
      try {
        const data = await getGalleryImages();
        const converted: ProjectGallery[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.image,
          images: [item.image],
          category: item.category,
        }));
        setProjects(converted);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const openGalleryPopup = (project: ProjectGallery) => {
    setSelectedProject(project);
    setCurrentImageIndex(0);
    document.body.style.overflow = "hidden";
  };

  const closeGalleryPopup = () => {
    setSelectedProject(null);
    setCurrentImageIndex(0);
    document.body.style.overflow = "auto";
  };

  const nextImage = () => {
    if (selectedProject) {
      setCurrentImageIndex((prev) => 
        prev === selectedProject.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProject) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProject.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />

      <ListingHero
        title={(pageContent?.heroTitle as string) || pageContent?.title}
        image={pageContent?.heroImage}
        loading={pageLoading}
        defaultAlt="Gallery"
      />

      {/* Gallery Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Decorative U Pattern Background */}

        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h3 className="text-[#1F2A54] text-2xl font-bold mb-2">GALLARY</h3>
            <p className="text-[#DDA21A] text-xl font-semibold">OUR LATEST PROJECTS</p>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No gallery images available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {projects.map((project, index) => (
                <div 
                  key={`${project.id}-${index}`} 
                  className="group cursor-pointer card-hover-lift"
                  onClick={() => openGalleryPopup(project)}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                    <SafeImage
                      src={project.thumbnail}
                      hideIfEmpty
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="text-[#1F2A54] text-center font-semibold text-lg">
                    {project.title}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Popup Modal */}
      {selectedProject && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center modal-backdrop-enter"
          onClick={closeGalleryPopup}
        >
          <div 
            className="relative max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeGalleryPopup}
              className="absolute -top-12 right-0 text-white hover:text-[#DDA21A] transition-colors"
            >
              <X size={32} />
            </button>

            {/* Project Title */}
            <h3 className="text-white text-2xl font-bold text-center mb-4">
              {selectedProject.title}
            </h3>

            {/* Main Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <SafeImage
                src={selectedProject.images[currentImageIndex]}
                hideIfEmpty
                alt={`${selectedProject.title} - Image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
              />

              {/* Navigation Arrows */}
              {selectedProject.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft size={28} className="text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight size={28} className="text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Image Counter */}
            <p className="text-white/70 text-center mt-4">
              {currentImageIndex + 1} / {selectedProject.images.length}
            </p>

            {/* Thumbnail Strip */}
            {selectedProject.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {selectedProject.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? "border-[#DDA21A]" : "border-transparent"
                    }`}
                  >
                    <SafeImage
                      src={img}
                      hideIfEmpty
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
