'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Phone } from 'lucide-react'
import CustomButton from '../ui/Buttons'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  return (
    <header className="header">
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
          <a 
            href="https://wa.me/5519971037836"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--cta btn--sm header__btn-hide-mobile"
          >
            <Phone size={16} />
            WhatsApp
          </a>
          <CustomButton onClick={() => {
            window.location.href = '/login'
          }}>
            Area Cliente
          </CustomButton>
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
            <a 
              href="https://wa.me/5519971037836"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--cta btn--base w-full"
            >
              <Phone size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  )
}