'use client'

import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
              About Lee
            </h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Hi, I'm Lee Barrowcliff — a photographer based in the East Midlands with a deep passion for capturing life as it happens. My approach is rooted in natural lifestyle photography, focusing on real moments over posed shots. Whether it's a quiet glance between newlyweds or the excitement of family tackling a high ropes course, I aim to tell authentic stories through my lens.
              </p>
              <p className="text-gray-300">
                Weddings are one of my favourite environments to shoot. I believe the best photos come when people feel relaxed and free to enjoy their day, and my unobtrusive, documentary style allows me to capture those genuine, fleeting moments.
              </p>
              <p className="text-gray-300">
                This love for capturing spontaneity naturally led me into sports photography, where unpredictability is part of the thrill. I particularly enjoy working around motorsports, golf, and watersports — each offering unique challenges and opportunities for striking imagery.
              </p>
              <p className="text-gray-300">
                As my own family has grown, so has my interest in portrait photography. I now offer a mobile studio setup for both natural and studio-lit portraits, making it easy to create professional images in a comfortable setting — whether that's in your home or on location.
              </p>
              <p className="text-gray-300">
                No matter the subject, my goal is always the same: to create honest, emotive photographs that you'll treasure for years to come.
              </p>
            </div>
          </div>
          <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
            {/* Placeholder for Lee's photo */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Photo of Lee coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 