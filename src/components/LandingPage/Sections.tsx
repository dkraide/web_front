import { ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Check, CheckCircle, Cloud, WifiOff, RefreshCw, Headphones, Store, UtensilsCrossed, Bike, QrCode, Bot,
  FileText, Truck, Boxes, Wallet, Network, Smartphone, Factory, ShoppingBasket, Shirt, Wrench, PawPrint,
  Plus, MessageCircle, ArrowRight, Receipt, TrendingUp, Sparkles,
} from 'lucide-react'
import s from '@/styles/landing.module.scss'
import { LogoMark, WHATSAPP, wpp } from './Navbar'

// Revela o bloco ao entrar na tela.
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setSeen(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`${s.reveal} ${seen ? s.in : ''} ${className}`}>{children}</div>
}

const Head = ({ tag, title, text }: { tag: string; title: string; text: string }) => (
  <Reveal className={s.sectionHead}>
    <span className={s.tag}>{tag}</span>
    <h2>{title}</h2>
    <p>{text}</p>
  </Reveal>
)

const Card = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <Reveal>
    <div className={s.card}>
      <div className={s.icon}><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  </Reveal>
)

// ---------------------------------------------------------------- HERO
export function Hero() {
  const bars = [38, 52, 44, 70, 58, 86, 74, 96]
  return (
    <section className={s.hero}>
      <div className={s.heroInner}>
        <div>
          <span className={s.eyebrow}><Sparkles size={14} /> 6 anos simplificando a gestão</span>
          <h1 className={s.heroTitle}>Venda mais. Controle tudo. <em>Sem complicação.</em></h1>
          <p className={s.heroText}>
            O KRD System junta frente de caixa, nota fiscal, estoque, financeiro e delivery em um só lugar.
            PDV para o seu comércio ou restaurante, ERP para a sua distribuidora, fábrica ou franquia.
          </p>
          <div className={s.heroCtas}>
            <a href={wpp('Olá! Gostaria de começar meu teste grátis do KRD System.')} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnPrimary}`}>
              Começar teste grátis <ArrowRight size={18} />
            </a>
            <button className={`${s.btn} ${s.btnGhost}`} onClick={() => document.getElementById('pdv')?.scrollIntoView({ behavior: 'smooth' })}>Conhecer as soluções</button>
          </div>
          <div className={s.heroChips}>
            <span><CheckCircle size={16} /> Instalação gratuita</span>
            <span><CheckCircle size={16} /> NF-e e NFC-e</span>
            <span><CheckCircle size={16} /> Funciona offline</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div className={s.mock}>
            <div className={s.mockBar}><i /><i /><i /></div>
            <div className={s.mockGrid}>
              <div className={s.mockCard}><small>Vendas hoje</small><strong>R$ 8.420</strong></div>
              <div className={s.mockCard}><small>Pedidos</small><strong>142</strong></div>
              <div className={s.mockCard}><small>Ticket médio</small><strong>R$ 59</strong></div>
              <div className={s.mockChart}>{bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
            </div>
          </div>
          <div className={`${s.float} ${s.f1}`}><Receipt size={16} /> NFC-e emitida</div>
          <div className={`${s.float} ${s.f2}`}><TrendingUp size={16} /> +18% no mês</div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- DIFERENCIAIS
export function Stats() {
  const items = [
    { icon: Cloud, t: '100% online', d: 'Acesse de qualquer dispositivo, em qualquer lugar.' },
    { icon: WifiOff, t: 'Funciona offline', d: 'O PDV segue vendendo sem internet e sincroniza ao voltar.' },
    { icon: RefreshCw, t: 'Sempre atualizado', d: 'Melhorias e adequações fiscais sem custo extra.' },
    { icon: Headphones, t: 'Suporte humano', d: 'Equipe especializada e assistente com IA.' },
  ]
  return (
    <section className={s.stats}>
      <div className={s.statsInner}>
        {items.map(({ icon: I, t, d }) => (
          <div key={t} className={s.stat}><I size={28} /><h3>{t}</h3><p>{d}</p></div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- PDV
export function PdvSection() {
  return (
    <section id="pdv" className={s.section}>
      <div className={s.container}>
        <div className={s.product}>
          <Reveal className={s.productCopy}>
            <span className={s.tag}>KRD PDV</span>
            <h2>Atenda rápido, do mercadinho ao restaurante.</h2>
            <p>Venda, emita a nota e baixe o estoque no mesmo clique, no PC, no tablet ou na maquininha. Você escolhe o formato que combina com a sua operação.</p>
            <ul className={s.checks}>
              <li><Check size={18} /> NF-e, NFC-e, SAT e TEF integrados</li>
              <li><Check size={18} /> Integração com balança, impressora e leitor</li>
              <li><Check size={18} /> Relatórios e portal na nuvem</li>
            </ul>
            <a href={wpp('Olá! Quero conhecer o KRD PDV.')} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnPrimary}`}>Falar com um consultor</a>
          </Reveal>
          <div className={s.miniGrid}>
            <Card icon={Store} title="PDV Desktop e Web" text="Alta performance com modo offline, ou 100% online sem instalar nada." />
            <Card icon={UtensilsCrossed} title="Garçom e comandas" text="Mapa de mesas, comanda digital e pedido direto para a cozinha." />
            <Card icon={Bike} title="Delivery próprio" text="Cardápio digital e app da sua marca, sem taxa por pedido. Integra iFood, 99Food e Keeta." />
            <Card icon={QrCode} title="Autoatendimento" text="Mercadinho autônomo e self-service com pagamento por Pix e cartão." />
            <Card icon={Bot} title="Edna, assistente com IA" text="Atendimento no WhatsApp e ajuda dentro do sistema, 24 horas." />
            <Card icon={Wallet} title="Pix e pagamentos" text="Recebimento integrado e conciliação automática das vendas." />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- ERP
export function ErpSection() {
  return (
    <section id="erp" className={`${s.section} ${s.dark}`}>
      <div className={s.container}>
        <Head
          tag="KRD ERP"
          title="Da venda externa à entrega, tudo sob controle."
          text="Para distribuidores, fábricas e franquias: o vendedor lança o pedido, o motorista entrega e você acompanha fiscal e financeiro em tempo real."
        />
        <div className={s.grid3}>
          <Card icon={FileText} title="Fiscal completo" text="NF-e, NFS-e, eventos, inutilização e perfis de tributação sem dor de cabeça." />
          <Card icon={Boxes} title="Estoque e compras" text="Entrada por nota, pedidos de compra, setores de estoque e comodatos." />
          <Card icon={Wallet} title="Financeiro" text="Boletos, borderô, cheques, conciliação bancária e comissões." />
          <Card icon={Smartphone} title="App do vendedor" text="Pedidos, orçamentos e visitas direto do celular, com roteiro de clientes." />
          <Card icon={Truck} title="Logística e motoristas" text="Rotas, romaneio e app do motorista com comprovação de entrega." />
          <Card icon={Network} title="Multi-loja e franquia" text="Matriz e unidades com relatórios consolidados e regras por franqueado." />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- SEGMENTOS
export function Segments() {
  const items = [
    { icon: ShoppingBasket, t: 'Mercados e mercearias' },
    { icon: UtensilsCrossed, t: 'Restaurantes e bares' },
    { icon: Bike, t: 'Pizzarias e delivery' },
    { icon: PawPrint, t: 'Pet shops' },
    { icon: Shirt, t: 'Moda e confecção' },
    { icon: Wrench, t: 'Oficinas' },
    { icon: Factory, t: 'Fábricas' },
    { icon: Truck, t: 'Distribuidores' },
    { icon: Network, t: 'Franquias' },
  ]
  return (
    <section id="segmentos" className={`${s.section} ${s.soft}`}>
      <div className={s.container}>
        <Head tag="Segmentos" title="Funciona do jeito que o seu negócio funciona." text="Telas e fluxos pensados para a rotina de cada segmento, para a sua equipe aprender em poucos dias." />
        <Reveal>
          <div className={s.chips}>{items.map(({ icon: I, t }) => <span key={t} className={s.chip}><I size={18} />{t}</span>)}</div>
        </Reveal>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- PLANOS
const plans = [
  { name: 'Mensal', price: '100', per: '/mês', desc: 'Para começar sem compromisso.', features: ['Todos os recursos incluídos', 'Emissão de NF-e e NFC-e', 'Controle de estoque', 'Portal na nuvem', 'Suporte por WhatsApp', 'Instalação gratuita'] },
  { name: 'Anual', price: '1.000', per: '/ano', desc: 'Melhor custo-benefício: economize R$ 200.', featured: true, features: ['Tudo do plano mensal', 'Suporte prioritário', 'Configuração de equipamentos', 'Treinamento da equipe'] },
  { name: 'Franquia', price: null, per: '', desc: 'Para redes, distribuidores e fábricas.', features: ['Gestão multi-lojas', 'Relatórios consolidados', 'Suporte dedicado', 'Instalação em todas as unidades', 'Integração customizada'] },
]

export function Plans() {
  return (
    <section id="planos" className={s.section}>
      <div className={s.container}>
        <Head tag="Planos" title="Planos simples, sem letra miúda." text="Instalação gratuita e 15 dias para testar antes de assinar." />
        <div className={s.plans}>
          {plans.map(p => (
            <Reveal key={p.name}>
              <div className={`${s.plan} ${p.featured ? s.featured : ''}`}>
                {p.featured && <span className={s.badge}>Mais escolhido</span>}
                <h3>{p.name}</h3>
                <p className={s.desc}>{p.desc}</p>
                <div className={s.price}>{p.price ? <><small>R$ </small>{p.price}<small> {p.per}</small></> : 'Sob consulta'}</div>
                <ul>{p.features.map(f => <li key={f}><Check size={16} />{f}</li>)}</ul>
                <a href={wpp(`Olá! Gostaria de saber mais sobre o plano ${p.name} do KRD System.`)} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${p.featured ? s.btnPrimary : s.btnOutline}`}>
                  <MessageCircle size={16} /> Falar no WhatsApp
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- FAQ
const faqs = [
  ['Preciso de internet para vender?', 'O PDV Desktop funciona offline e sincroniza assim que a conexão volta. Já o PDV Web e o ERP são online.'],
  ['Vocês emitem nota fiscal?', 'Sim. NF-e, NFC-e e NFS-e, com configuração tributária feita pela nossa equipe.'],
  ['Como funciona o teste grátis?', 'Você chama a gente no WhatsApp, nós instalamos e configuramos tudo, e você usa por 15 dias sem compromisso. Gostou, escolhe o plano.'],
  ['Integra com iFood e outros apps?', 'Sim: iFood, 99Food e Keeta chegam na mesma tela do seu PDV, junto com o app próprio de delivery.'],
  ['Atende franquias e redes?', 'Sim. O ERP é multi-loja, com relatórios consolidados e regras por unidade.'],
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className={`${s.section} ${s.soft}`}>
      <div className={s.container}>
        <Head tag="Dúvidas" title="Perguntas frequentes" text="Não achou o que procurava? Chame a gente no WhatsApp." />
        <div className={s.faq}>
          {faqs.map(([q, a], i) => (
            <div key={q} className={`${s.faqItem} ${open === i ? s.open : ''}`}>
              <button onClick={() => setOpen(open === i ? null : i)}>{q}<Plus size={20} /></button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- CTA + FOOTER
export function FinalCta() {
  return (
    <div className={s.ctaWrap} style={{ marginTop: 6 * 16 }}>
      <div className={s.cta}>
        <h2>Vamos colocar o seu negócio no trilho?</h2>
        <p>Teste o KRD System por 15 dias. A gente instala, configura e treina a sua equipe, sem custo.</p>
        <a href={wpp('Olá! Gostaria de começar meu teste grátis de 15 dias do KRD System.')} target="_blank" rel="noopener noreferrer" className={s.btn}>
          <MessageCircle size={18} /> Começar teste grátis
        </a>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className={s.footer} style={{ marginTop: '4rem' }}>
      <div className={s.footerGrid}>
        <div>
          <LogoMark />
          <p>Ecossistema de PDV e ERP para varejo, food service, distribuidores, fábricas e franquias.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          <ul>
            <li><a href="#pdv">PDV</a></li>
            <li><a href="#erp">ERP</a></li>
            <li><a href="#planos">Planos</a></li>
            <li><Link href="/downloads">Downloads</Link></li>
            <li><Link href="/login">Área do cliente</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contato</h4>
          <ul>
            <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">(19) 99103-7836</a></li>
            <li><a href="https://www.instagram.com/krdsystem" target="_blank" rel="noopener noreferrer">@krdsystem</a></li>
          </ul>
        </div>
      </div>
      <div className={s.footerBottom}>© {new Date().getFullYear()} KRD System. Todos os direitos reservados.</div>
    </footer>
  )
}
