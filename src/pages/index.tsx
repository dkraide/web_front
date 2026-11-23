import Head from 'next/head'
import { Poppins } from 'next/font/google'
import Navbar from '@/components/LandingPage/Navbar'
import { Hero, Stats, PdvSection, ErpSection, Segments, Plans, Faq, FinalCta, Footer } from '@/components/LandingPage/Sections'
import { canSSRGuest } from '@/utils/CanSSRGuest'
import s from '@/styles/landing.module.scss'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export default function Home() {
  return (
    <div className={`${s.page} ${poppins.className}`}>
      <Head>
        <title>KRD System | PDV e ERP para varejo, food service, distribuidores e franquias</title>
        <meta name="description" content="PDV e ERP integrados: fiscal, estoque, financeiro, delivery e atendimento com IA. Teste grátis por 15 dias." />
      </Head>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <PdvSection />
        <ErpSection />
        <Segments />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export const getServerSideProps = canSSRGuest(async () => {
  return { props: {} }
})
