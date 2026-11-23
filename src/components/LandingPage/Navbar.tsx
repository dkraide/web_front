import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import s from '@/styles/landing.module.scss'

export const WHATSAPP = 'https://wa.me/5519971037836'
export const wpp = (msg: string) => `${WHATSAPP}?text=${encodeURIComponent(msg)}`

const links = [
  { id: 'pdv', label: 'PDV' },
  { id: 'erp', label: 'ERP' },
  { id: 'segmentos', label: 'Segmentos' },
  { id: 'planos', label: 'Planos' },
  { id: 'faq', label: 'Dúvidas' },
]

export function LogoMark() {
  return (
    <span className={s.logo}>
      <img src="/krd_logo_icon.png" alt="" style={{ borderRadius: 10, background: '#fff' }} />
      <span>KRD System</span>
    </span>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`${s.nav} ${scrolled || open ? s.scrolled : ''}`}>
      <div className={s.navInner}>
        <Link href="/"><LogoMark /></Link>
        <nav className={s.navLinks}>
          {links.map(l => <button key={l.id} onClick={() => go(l.id)}>{l.label}</button>)}
          <Link href="/downloads">Downloads</Link>
        </nav>
        <div className={s.navActions}>
          <Link href="/login" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}>Área do cliente</Link>
          <a href={wpp('Olá! Gostaria de testar o KRD System.')} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}>Teste grátis</a>
        </div>
        <button className={s.burger} onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className={s.mobileMenu}>
          {links.map(l => <button key={l.id} onClick={() => go(l.id)}>{l.label}</button>)}
          <Link href="/downloads">Downloads</Link>
          <Link href="/login">Área do cliente</Link>
          <a href={wpp('Olá! Gostaria de testar o KRD System.')} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnPrimary}`} style={{ marginTop: 12 }}>Teste grátis</a>
        </div>
      )}
    </header>
  )
}
