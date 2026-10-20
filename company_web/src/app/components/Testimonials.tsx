"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  _id: string;
  title: string;
  content: string;
  testimonialData: {
    authorName: string;
    authorRole: string;
    authorImage?: string;
    rating: number;
    isVerified: boolean;
    treatmentType?: string;
  };
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content/testimonials/all?verified=true&limit=6`);
      const data = await res.json();
      
      if (data.success) {
        setTestimonials(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch testimonials", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3));
  };

  if (loading) {
    return (
      <section className="py-24 bg-slate-50">
        <div className="container">
          <div className="flex justify-center">
            <div className="loader"></div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const visibleTestimonials = testimonials.slice(currentIndex * 3, currentIndex * 3 + 3);

  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-4 block">
            Testimonials
          </span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            What Our Patients Say
          </h2>
          <p className="text-slate-600 text-lg">
            Real stories from real patients who have experienced the difference with Dr Strip healthcare services.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-8">
            {visibleTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </div>

          {/* Navigation */}
          {testimonials.length > 3 && (
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all"
              >
                <ChevronRight className="w-6 h-6 text-slate-600" />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "10,000+", label: "Happy Patients" },
            { value: "500+", label: "Expert Doctors" },
            { value: "50,000+", label: "Appointments" },
            { value: "4.9", label: "Average Rating" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</p>
              <p className="text-slate-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { testimonialData, content, title } = testimonial;
  
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
      {/* Quote Icon */}
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Quote className="w-6 h-6 text-blue-600" />
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < testimonialData.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <h3 className="font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 mb-6 flex-1 line-clamp-4">
        {content}
      </p>

      {/* Author */}
      <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
          {testimonialData.authorImage ? (
            <img 
              src={testimonialData.authorImage} 
              alt={testimonialData.authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900">{testimonialData.authorName}</p>
            {testimonialData.isVerified && (
              <span className="text-blue-500" title="Verified Patient">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{testimonialData.authorRole}</p>
        </div>
      </div>

      {/* Treatment Type */}
      {testimonialData.treatmentType && (
        <div className="mt-4">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
            {testimonialData.treatmentType}
          </span>
        </div>
      )}
    </div>
  );
}
