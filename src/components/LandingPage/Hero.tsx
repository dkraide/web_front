import { CheckCircle, Star, Users, Award } from 'lucide-react'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__content">
          <h1 className="hero__title">
            Sistema PDV <span className="highlight">Completo</span> para seu Negócio
          </h1>
          <p className="hero__description">
            Controle total do seu estabelecimento com emissão de NFe/NFCe, gestão de estoque, 
            relatórios financeiros e portal na nuvem. Tudo em um só lugar.
          </p>
          
          <div className="hero__highlights">
            <div className="hero__highlights-item">
              <CheckCircle size={16} className="icon" />
              <span>6 anos de experiência</span>
            </div>
            <div className="hero__highlights-item">
              <Users size={16} className="icon" />
              <span>Centenas de clientes</span>
            </div>
            <div className="hero__highlights-item">
              <Award size={16} className="icon" />
              <span>Instalação gratuita</span>
            </div>
            <div className="hero__highlights-item">
              <Star size={16} className="icon" />
              <span>Suporte especializado</span>
            </div>
          </div>

          <div className="hero__actions">
            <a 
              href="https://wa.me/5519971037836?text=Olá! Gostaria de começar meu teste grátis do KRD System."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--hero btn--xl"
            >
              Começar Teste Grátis
            </a>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn btn--outline btn--xl"
            >
              Ver Planos
            </button>
          </div>
        </div>

        <div className="hero__video">
          <iframe
            src="https://www.youtube.com/embed/m3_vaq4iBJ0"
            title="KRD System - Demonstração"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  )
}