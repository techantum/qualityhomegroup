"use client";

import React from "react"

import { useState } from "react";
import { BrandingLogo } from "@/components/branding-logo";
import { X } from "lucide-react";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnquiryModal({ isOpen, onClose }: EnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    projectType: "",
    newsletter: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const projectTypes = [
    "Apartments",
    "Villas",
    "Commercial",
    "Plots",
    "Farm Lands",
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[+]?[\d\s-]{10,}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Please enter a valid mobile number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.projectType) {
      newErrors.projectType = "Please select a project type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Submit to API
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          name: "",
          mobile: "",
          email: "",
          projectType: "",
          newsletter: false,
        });
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting enquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 modal-backdrop-enter overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl w-full max-w-md mx-4 p-6 sm:p-8 shadow-xl modal-content-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <BrandingLogo
            variant="header"
            width={80}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#1F2A54] text-center mb-6">
          Enquire Now
        </h2>

        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-[#1F2A54] font-semibold">
              Thank you for your enquiry!
            </p>
            <p className="text-gray-500 text-sm mt-1">
              We will get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name*"
                className={`w-full px-0 py-2 border-b transition-colors duration-300 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } focus:border-[#DDA21A] focus:outline-none text-sm bg-transparent`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <div className="flex items-baseline gap-1">
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Mobile number*"
                  className={`flex-1 px-0 py-2 border-b transition-colors duration-300 ${
                    errors.mobile ? "border-red-500" : "border-gray-300"
                  } focus:border-[#DDA21A] focus:outline-none text-sm bg-transparent`}
                />
                <span className="text-[#DDA21A] text-xs whitespace-nowrap">
                  (with country Code)
                </span>
              </div>
              {errors.mobile && (
                <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={`w-full px-0 py-2 border-b transition-colors duration-300 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:border-[#DDA21A] focus:outline-none text-sm bg-transparent`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className={`w-full px-0 py-2 border-b transition-colors duration-300 ${
                  errors.projectType ? "border-red-500" : "border-gray-300"
                } focus:border-[#DDA21A] focus:outline-none text-sm bg-transparent text-gray-500`}
              >
                <option value="">Select the project type</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.projectType && (
                <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>
              )}
            </div>

            {/* Newsletter Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="newsletter"
                id="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                className="mt-1 w-4 h-4 accent-[#DDA21A]"
              />
              <label htmlFor="newsletter" className="text-xs text-gray-600 leading-relaxed">
                Yes, I want to stay informed and receive newsletter and marketing
                updates.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#C9A86C] text-white font-medium rounded-full hover:bg-[#b89555] transition-all duration-300 disabled:opacity-50 mt-4 hover:shadow-lg active:scale-[0.98]"
            >
              {isSubmitting ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
