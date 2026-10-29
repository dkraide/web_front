import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import KRDBaseModal from '@/components/Modals/KRDBaseModal'
import { TEF_WHATSAPP_URL } from '@/data/novidades'
import styles from './styles.module.scss'

const COOKIE_VISTO = '@web_front.anuncioTef'
const COOKIE_TOKEN = '@web_front.token'

/**
 * Anuncia o TEF uma unica vez por navegador, ao abrir o dashboard logado.
 */
export default function AnuncioTef() {
    const router = useRouter()
    const [aberto, setAberto] = useState(false)

    useEffect(() => {
        const cookies = parseCookies()
        if (!cookies[COOKIE_TOKEN] || cookies[COOKIE_VISTO]) return
        if (router.pathname !== '/dashboard') return

        function abrir() {
            setAberto(true)
            setCookie(undefined, COOKIE_VISTO, '1', {
                maxAge: 60 * 60 * 24 * 365 * 10,
                path: '/',
            })
        }

        // Espera o anuncio do iFood ser fechado para nao empilhar modais.
        if ((window as any).__anuncioIfoodAberto) {
            window.addEventListener('anuncio-ifood-fechado', abrir, { once: true })
            return () => window.removeEventListener('anuncio-ifood-fechado', abrir)
        }
        abrir()
    }, [router.pathname])

    return (
        <KRDBaseModal isOpen={aberto} setClose={() => setAberto(false)} headerOff width={42} height={70}>
            <div className={styles.content}>
                <span className={styles.badge}>Novidade</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/novidades/tef.webp" alt="Maquininha TEF" className={styles.imagem} />
                <h2>Agora aceitamos TEF!</h2>
                <p>Receba pagamentos em cartão direto na maquininha, integrado ao seu sistema.</p>
                <div className={styles.actions}>
                    <button className={styles.secondary} onClick={() => setAberto(false)}>Agora não</button>
                    <a className={styles.primary} href={TEF_WHATSAPP_URL} target="_blank" rel="noreferrer" onClick={() => setAberto(false)}>
                        Quero saber mais
                    </a>
                </div>
                <a className={styles.link} href="/novidades" onClick={() => setAberto(false)}>Ver todas as novidades</a>
            </div>
        </KRDBaseModal>
    )
}
