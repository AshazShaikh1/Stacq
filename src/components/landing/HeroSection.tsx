"use client";

import { motion } from "framer-motion";
import { LandingPageButtons } from "./LandingPageButtons";

export function HeroSection() {
  return (
    <motion.div
      className="relative bg-gradient-to-b from-emerald-50/50 via-white to-white py-20 md:py-32 lg:py-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorative shapes - adjusted for mobile safety */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 md:w-96 md:h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-40 -right-20 w-64 h-64 md:w-80 md:h-80 bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full bg-emerald border border-emerald-100 text-white text-xs md:text-sm font-semibold tracking-wide uppercase"
          >
            The Anti-Algorithm Feed
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 md:mb-8 tracking-tight leading-[1.1]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Curate the internet, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-emerald">
              not just consume it.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-500 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Stacq is a human-curated knowledge network. Save the best resources,
            organize them into stacks, and discover what experts are actually
            reading.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <LandingPageButtons />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
