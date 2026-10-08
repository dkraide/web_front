'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Menu, X, Download } from 'lucide-react'
import CustomButton from '../ui/Buttons'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const isHome = router.pathname === '/'

  const scrollToSection = (sectionId: string) => {
    // Fora da home as seções não existem: volta para a home já na âncora.
    if (!isHome) {
      setIsMenuOpen(false)
      router.push(`/#${sectionId}`)
      return
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  return (
    // --background só é um HSL válido dentro de .min-h-screen (home); fixamos aqui para o Header funcionar em qualquer página.
    <header className="header" style={{ ['--background' as string]: '222.2 84% 4.9%' }}>
      <div className="header__container">
        <Link href="/" className="header__logo">
          <Image 
            src="/logo.svg" 
            alt="KRD System Logo" 
            width={32}
            height={32}
          />
          <span>KRD System</span>
        </Link>

        <nav className="header__nav">
          <button onClick={() => scrollToSection('features')}>Recursos</button>
          <button onClick={() => scrollToSection('pricing')}>Preços</button>
          <button onClick={() => scrollToSection('about')}>Sobre</button>
          <button onClick={() => scrollToSection('contact')}>Contato</button>
        </nav>

        <div className="header__actions">
          <a 
            href="https://wa.me/5519971037836?text=Olá! Gostaria de saber mais sobre o teste grátis do KRD System."
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--outline btn--sm header__btn-hide-mobile"
          >
            Teste Grátis
          </a>
          <Link
            href="/downloads"
            className="btn btn--cta btn--sm header__btn-hide-mobile"
          >
            <Download size={16} />
            Downloads
          </Link>
          {router.pathname !== '/login' && (
            <CustomButton onClick={() => {
              window.location.href = '/login'
            }}>
              Area Cliente
            </CustomButton>
          )}
        </div>

        <button 
          className="header__mobile-menu btn btn--ghost btn--icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-menu__nav">
            <button onClick={() => scrollToSection('features')}>Recursos</button>
            <button onClick={() => scrollToSection('pricing')}>Preços</button>
            <button onClick={() => scrollToSection('about')}>Sobre</button>
            <button onClick={() => scrollToSection('contact')}>Contato</button>
          </nav>
          <div className="mobile-menu__actions">
            <a 
              href="https://wa.me/5519971037836?text=Olá! Gostaria de saber mais sobre o teste grátis do KRD System."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline btn--base w-full"
            >
              Teste Grátis
            </a>
            <Link
              href="/downloads"
              className="btn btn--cta btn--base w-full"
            >
              <Download size={16} />
              Downloads
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}