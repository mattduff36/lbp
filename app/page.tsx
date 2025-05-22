import ClientHero from './components/ClientHero'
import GalleryPreview from './components/GalleryPreview'

const galleries = [
  { name: 'Weddings', path: '/portfolio/weddings' },
  { name: 'Portraits', path: '/portfolio/portraits' },
  { name: 'Events', path: '/portfolio/events' },
  { name: 'Landscapes', path: '/portfolio/landscapes' },
  { name: 'Wildlife', path: '/portfolio/wildlife' },
  { name: 'Architecture', path: '/portfolio/architecture' },
]

export default function Home() {
  return (
    <div className="flex flex-col items-stretch">
      <ClientHero />
      <section id="portfolio" className="py-16 w-full bg-black">
        <div className="w-full px-8">
          <h2 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat text-center mb-12">
            Portfolio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {galleries.map((gallery) => (
              <GalleryPreview
                key={gallery.path}
                name={gallery.name}
                path={gallery.path}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 