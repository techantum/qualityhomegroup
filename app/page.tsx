import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ProjectsSection } from "@/components/projects-section";
import { VideoSection } from "@/components/video-section";
import { WhyUsSection } from "@/components/why-us-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { NewsSection } from "@/components/news-section";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";

export default function HomePage() {
  return (
    <PageTransition>
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <VideoSection />
      <WhyUsSection />
      <TestimonialsSection />
      <NewsSection />
      <Footer />
    </main>
    </PageTransition>
  );
}
