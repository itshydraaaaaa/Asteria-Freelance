import { HeroSection }        from '@/components/sections/HeroSection'
import { HowItWorksSection }  from '@/components/sections/HowItWorksSection'
import { FeaturedGigsSection} from '@/components/sections/FeaturedGigsSection'
import { CategoriesSection }  from '@/components/sections/CategoriesSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturedGigsSection />
      <CategoriesSection />
    </>
  )
}
