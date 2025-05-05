import ClientHero from './components/ClientHero'
import ClientGallery from './components/ClientGallery'

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <ClientHero />
      <ClientGallery />
    </div>
  )
} 