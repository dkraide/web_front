import Header from '@/components/LandingPage/Header'
import Hero from '@/components/LandingPage/Hero'
import Features from '@/components/LandingPage/Features'
import Pricing from '@/components/LandingPage/Pricing'
import About from '@/components/LandingPage/About'
import Contact from '@/components/LandingPage/Contact'
import Footer from '@/components/LandingPage/Footer'
import { canSSRGuest } from '@/utils/CanSSRGuest'
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // pesos que você vai usar
});

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className={poppins.className}>
        <Hero />
        <Features />
        <Pricing />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
export const getServerSideProps = canSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})