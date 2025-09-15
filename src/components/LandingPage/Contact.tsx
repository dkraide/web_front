import { Phone, Instagram, MessageCircle, CheckCircle } from 'lucide-react'

export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__container">
        <div className="contact__header">
          <h2>Entre em Contato</h2>
          <p>
            Estamos prontos para ajudar você a revolucionar a gestão do seu negócio. 
            Fale conosco e comece hoje mesmo!
          </p>
        </div>

        <div className="contact__content">
          <div className="contact__info">
            <div className="item">
              <div className="icon">
                <Phone size={20} />
              </div>
              <div className="content">
                <h3>WhatsApp</h3>
                <p>Atendimento rápido e personalizado</p>
                <a 
                  href="https://wa.me/5519971037836"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (19) 99103-7836
                </a>
              </div>
            </div>

            <div className="item">
              <div className="icon">
                <Instagram size={20} />
              </div>
              <div className="content">
                <h3>Instagram</h3>
                <p>Siga-nos para novidades e dicas</p>
                <a 
                  href="https://www.instagram.com/krdsystem"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @krdsystem
                </a>
              </div>
            </div>
          </div>

          <div className="contact__cta">
            <h3>Teste Grátis por 15 Dias</h3>
            <p>
              Experimente todas as funcionalidades do KRD System sem compromisso. 
              Nossa equipe configura tudo para você!
            </p>
            
            <ul>
              <li>
                <CheckCircle size={16} className="icon" />
                <span>Instalação gratuita</span>
              </li>
              <li>
                <CheckCircle size={16} className="icon" />
                <span>Configuração completa</span>
              </li>
              <li>
                <CheckCircle size={16} className="icon" />
                <span>Treinamento incluído</span>
              </li>
              <li>
                <CheckCircle size={16} className="icon" />
                <span>Suporte especializado</span>
              </li>
            </ul>

            <a
              href="https://wa.me/5519971037836?text=Olá! Gostaria de começar meu teste grátis de 15 dias do KRD System."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--hero btn--xl w-full"
            >
              <MessageCircle size={20} />
              Começar Teste Grátis
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}