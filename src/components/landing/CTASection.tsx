"use client";

import { motion } from "framer-motion";
import { LandingPageCTAButtons } from "./LandingPageButtons";

export function CTASection() {
  return (
    <motion.section
      className="py-20 md:py-32 bg-gradient-to-br from-emerald to-emerald-dark text-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          Ready to curate your corner?
        </h2>
        <p className="text-lg md:text-xl text-white mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of learners, developers, and creatives building their
          personal knowledge libraries on Stacq.
        </p>

        <div className="flex justify-center">
          <LandingPageCTAButtons />
        </div>

        <p className="mt-8 text-sm text-white">
          No credit card required • Free forever for individuals
        </p>
      </div>
    </motion.section>
  );
}
