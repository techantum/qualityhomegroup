"use client";

import React from "react"

import { useEffect, useState } from "react";
import type { ContactInfo } from "@/lib/firestore";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListingHero } from "@/components/listing-hero";
import { Loader2, ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState<string | undefined>();
  const [heroImage, setHeroImage] = useState<string | undefined>();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const res = await fetch("/api/v1/content/contact");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) {
          setContactInfo(json.data);
          if (json.data.heroTitle) setHeroTitle(json.data.heroTitle);
          if (json.data.heroImage) setHeroImage(json.data.heroImage);
        }
      } catch (e) {
        console.error("Contact page load error:", e);
      } finally {
        setPageLoading(false);
      }
    }
    fetchContactInfo();
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: "",
          message: formData.message,
          source: "contact_form",
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({ firstName: "", lastName: "", email: "", message: "" });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Header */}
      <Header />

      <ListingHero title={heroTitle} image={heroImage} loading={pageLoading} defaultAlt="Contact Us" />

      {/* Contact Cards */}
      <section className="py-16 bg-[#F5F5F5]">
        <div className="max-w-[900px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Card */}
            <div className="bg-[#ffffff] rounded-[8px] p-6 border border-gray-200 flex flex-col h-[220px] card-hover-lift transition-all duration-300">
              <div className="mb-4 text-[#1F2A54]">
                <Mail className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-[#1F2A54] font-bold text-base mb-1">Support email</h3>
              <p className="text-[#666666] text-sm mb-auto">{contactInfo?.email || "—"}</p>
              <a 
                href={contactInfo?.email ? `mailto:${contactInfo.email}` : "#"}
                className="block w-full py-2.5 bg-[#C9A86C] text-white text-sm font-medium rounded-full text-center hover:bg-[#b89555] transition-colors mt-4"
              >
                Email Us
              </a>
            </div>

            {/* Phone Card */}
            <div className="bg-[#ffffff] rounded-[8px] p-6 border border-gray-200 flex flex-col h-[220px] card-hover-lift transition-all duration-300">
              <div className="mb-4 text-[#1F2A54]">
                <Phone className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-[#1F2A54] font-bold text-base mb-1">Phone number</h3>
              <p className="text-[#666666] text-sm mb-auto">{contactInfo?.phone || "—"}</p>
              <a 
                href={contactInfo?.phone ? `tel:${contactInfo.phone.replace(/[^0-9+]/g, "")}` : "#"}
                className="block w-full py-2.5 bg-[#C9A86C] text-white text-sm font-medium rounded-full text-center hover:bg-[#b89555] transition-colors mt-4"
              >
                Call Us
              </a>
            </div>

            {/* Location Card */}
            <div className="bg-[#ffffff] rounded-[8px] p-6 border border-gray-200 flex flex-col h-[220px]">
              <div className="mb-4 text-[#1F2A54]">
                <MapPin className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-[#1F2A54] font-bold text-base mb-1">Location</h3>
              <p className="text-[#666666] text-sm mb-auto line-clamp-2">{contactInfo?.address || "—"}</p>
              <a 
                href={contactInfo?.address ? `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-[#C9A86C] text-white text-sm font-medium rounded-full text-center hover:bg-[#b89555] transition-colors mt-4"
              >
                Visit Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Leave a Message Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[900px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-[#1F2A54] mb-8">
                Leave a message
              </h2>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">Thank you for your message! We will get back to you soon.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name*"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-lg text-sm placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#DDA21A]/50 transition-all duration-300 ${
                        errors.firstName ? "border-red-500" : "border-transparent"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name*"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-lg text-sm placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#DDA21A]/50 transition-all duration-300 ${
                        errors.lastName ? "border-red-500" : "border-transparent"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email*"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-lg text-sm placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#DDA21A]/50 transition-all duration-300 ${
                      errors.email ? "border-red-500" : "border-transparent"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <textarea
                    name="message"
                    placeholder="Message..."
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-[#F5F5F5] border rounded-lg text-sm placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#DDA21A]/50 resize-none transition-all duration-300 ${
                      errors.message ? "border-red-500" : "border-transparent"
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative inline-flex items-center px-6 py-2.5 pr-10 bg-transparent border border-gray-300 text-[#000000] text-sm font-medium rounded-full hover:bg-[#1F2A54] hover:text-[#ffffff] hover:border-[#1F2A54] transition-all duration-300 disabled:opacity-50 group hover:shadow-lg active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit
                      <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#DDA21A] rounded-full flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden h-[400px] lg:h-auto">
              {contactInfo?.mapUrl ? (
              <iframe
                src={contactInfo.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100 text-gray-500 text-sm">
                  Map embed URL can be configured in the admin contact settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
