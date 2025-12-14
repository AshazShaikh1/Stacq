'use client';

import { motion } from 'framer-motion';
import { FolderPlus, Link2, Share2 } from 'lucide-react';

const steps = [
  {
    icon: FolderPlus,
    title: 'Create Collections',
    description: 'Group your resources into clean, themed spaces.',
    details: 'Each collection can include links, videos, articles, tools, images, and more.',
    imageSide: 'right' as const,
  },
  {
    icon: Link2,
    title: 'Add Cards',
    description: 'Save any resource as a Card—manually or with our browser extension.',
    details: 'Stacq automatically fetches metadata, thumbnails, and descriptions for you.',
    imageSide: 'left' as const,
  },
  {
    icon: Share2,
    title: 'Share & Discover',
    description: 'Publish your collections, follow Stacqers, and find high-quality resources.',
    details: 'Build your reputation as a curator and help others learn.',
    imageSide: 'right' as const,
  },
];

export function HowItWorksSection() {
  return (
      <section className="py-16 md:py-32 overflow-hidden bg-grey-100">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div 
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            How Stacq Works
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
            Three simple steps to curb information overload.
          </p>
        </motion.div>
        
        <div className="space-y-20 md:space-y-32">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLeft = step.imageSide === 'left';
            
            return (
              <motion.div
                key={index}
                className={`flex flex-col ${isLeft ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 md:gap-16 lg:gap-24`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Text Content */}
                <div className="flex-1 w-full text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mb-6 shadow-sm">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-4 font-medium">
                    {step.description}
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    {step.details}
                  </p>
                </div>

                {/* Visual Placeholder */}
                <div className="flex-1 w-full relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl transform rotate-3 opacity-50 group-hover:rotate-6 transition-transform duration-500"></div>
                  <div className="relative aspect-[4/3] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex items-center justify-center">
                    <div className="text-9xl opacity-10 filter grayscale select-none">
                      {index === 0 && '📁'}
                      {index === 1 && '🔗'}
                      {index === 2 && '🚀'}
                    </div>
                    {/* In a real app, put screenshots here */}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}