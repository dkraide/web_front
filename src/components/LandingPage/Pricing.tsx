import { Check, MessageCircle } from 'lucide-react'

const plans = [
  {
    name: 'Mensal',
    price: 100,
    period: 'mês',
    description: 'Perfeito para testar o sistema',
    features: [
      'Todos os recursos incluídos',
      'Emissão de NFe/NFCe',
      'Controle de estoque',
      'Portal na nuvem',
      'Suporte por WhatsApp',
      'Instalação gratuita'
    ],
    popular: false
  },
  {
    name: 'Anual',
    price: 1000,
    period: 'ano',
    description: 'Melhor custo-benefício - economize R$ 200',
    features: [
      'Todos os recursos incluídos',
      'Emissão de NFe/NFCe',
      'Controle de estoque',
      'Portal na nuvem',
      'Suporte prioritário',
      'Instalação gratuita',
      'Configuração de equipamentos',
      'Treinamento da equipe'
    ],
    popular: true
  },
  {
    name: 'Franquia',
    price: null,
    period: '',
    description: 'Plano especial para redes e franquias',
    features: [
      'Todos os recursos incluídos',
      'Gestão multi-lojas',
      'Relatórios consolidados',
      'Suporte dedicado',
      'Instalação em todas as unidades',
      'Treinamento personalizado',
      'Integração customizada'
    ],
    popular: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="pricing">
      <div className="pricing__container">
        <div className="pricing__header">
          <h2>Planos que Cabem no seu Bolso</h2>
          <p>
            Escolha o plano ideal para o seu negócio. Todos incluem instalação gratuita e suporte especializado.
          </p>
        </div>

        <div className="pricing__grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing__card ${plan.popular ? 'featured' : ''}`}>
              <h3>{plan.name}</h3>
              
              <div className="price">
                {plan.price ? (
                  <>
                    <span className="currency">R$</span>
                    {plan.price.toLocaleString('pt-BR')}
                  </>
                ) : (
                  'Consultar'
                )}
              </div>
              
              {plan.period && <div className="period">por {plan.period}</div>}
              
              <p className="description">{plan.description}</p>

              <ul className="features">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>
                    <Check size={16} className="icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`https://wa.me/5519971037836?text=Olá! Gostaria de saber mais sobre o plano ${plan.name} do KRD System.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--cta btn--lg w-full"
              >
                <MessageCircle size={16} />
                Falar no WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}