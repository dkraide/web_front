import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Phone } from 'lucide-react'

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__brand">
            <div className="logo">
              <Image 
                src="/logo.svg" 
                alt="KRD System Logo" 
                width={32}
                height={32}
              />
              <span>KRD System</span>
            </div>
            <p>
              Sistema PDV completo para sua empresa. 6 anos de experiência 
              oferecendo soluções tecnológicas que fazem a diferença no seu negócio.
            </p>
            <div className="footer__social">
              <a 
                href="https://wa.me/5519971037836"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <Phone size={20} />
              </a>
              <a 
                href="https://www.instagram.com/krdsystem"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div className="footer__section">
            <h3>Links Rápidos</h3>
            <ul>
              <li>
                <button onClick={() => scrollToSection('features')}>
                  Recursos
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')}>
                  Preços
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')}>
                  Sobre Nós
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')}>
                  Contato
                </button>
              </li>
            </ul>
          </div>

          <div className="footer__section">
            <h3>Contato</h3>
            <ul>
              <li>
                <a 
                  href="https://wa.me/5519971037836"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (19) 99103-7836
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/krdsystem"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @krdsystem
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/5519971037836?text=Olá! Gostaria de saber mais sobre o KRD System."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Teste Grátis
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; 2024 KRD System. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}