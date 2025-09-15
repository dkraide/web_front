import { 
  Package, 
  FileText, 
  Cloud, 
  Shield, 
  TestTube, 
  Wrench, 
  Settings, 
  BarChart3 
} from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Gerencie seu estoque em tempo real com alertas de baixo estoque e controle de entrada e saída de produtos.'
  },
  {
    icon: FileText,
    title: 'Emissão de NFe / NFCe',
    description: 'Emita notas fiscais eletrônicas automaticamente e mantenha-se em conformidade com a legislação.'
  },
  {
    icon: Cloud,
    title: 'Portal na Nuvem',
    description: 'Acesse seu sistema de qualquer lugar com nosso portal na nuvem seguro e confiável.'
  },
  {
    icon: Shield,
    title: 'Controle de Permissões',
    description: 'Defina diferentes níveis de acesso para seus funcionários e mantenha a segurança dos dados.'
  },
  {
    icon: TestTube,
    title: 'Teste Grátis',
    description: 'Experimente todas as funcionalidades do sistema sem compromisso antes de assinar um plano.'
  },
  {
    icon: Wrench,
    title: 'Instalação Gratuita',
    description: 'Nossa equipe instala e configura tudo para você. Sistema funcionando sem dor de cabeça.'
  },
  {
    icon: Settings,
    title: 'Configuração de Equipamentos',
    description: 'Configuramos balança, impressora, leitor de código de barras e outros equipamentos.'
  },
  {
    icon: BarChart3,
    title: 'Relatórios Financeiros',
    description: 'Acompanhe o desempenho do seu negócio com relatórios detalhados e análises completas.'
  }
]

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="features__container">
        <div className="features__header">
          <h2>Recursos que Fazem a Diferença</h2>
          <p>
            Tudo que você precisa para gerenciar seu negócio de forma eficiente e profissional.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="features__card">
                <div className="icon">
                  <IconComponent size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}