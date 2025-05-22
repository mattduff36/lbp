'use client'

import ContactForm from '../components/ContactForm'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
              Get in Touch
            </h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                I'd love to hear from you! Whether you're interested in booking a session, have questions about my services, or just want to say hello, feel free to reach out.
              </p>
              <div className="mt-8 space-y-4">
                <div>
                  <h2 className="text-xl font-medium text-gray-300 mb-2">Contact Information</h2>
                  <p className="text-gray-300">Email: info@leebarrowcliffphotography.com</p>
                  <p className="text-gray-300">Phone: 07700 900000</p>
                  <p className="text-gray-300">Website: leebarrowcliffphotography.com</p>
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-300 mb-2">Location</h2>
                  <p className="text-gray-300">Based in the North of England</p>
                  <p className="text-gray-300">Available for travel throughout the UK</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-black rounded-lg p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
} 