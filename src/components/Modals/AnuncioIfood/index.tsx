import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import KRDBaseModal from '@/components/Modals/KRDBaseModal'
import styles from './styles.module.scss'

const COOKIE_VISTO = '@web_front.anuncioIfood'
const COOKIE_TOKEN = '@web_front.token'
const SUPORTE_URL =
    'https://wa.me/5519971037836?text=' +
    encodeURIComponent('Olá! Gostaria de ativar a integração gratuita com o iFood no meu sistema.')

/**
 * Anuncia a integracao com o iFood uma unica vez por navegador.
 * So aparece com o usuario logado; ao ser exibido grava o cookie para nao repetir.
 */
export default function AnuncioIfood() {
    const router = useRouter()
    const [aberto, setAberto] = useState(false)

    useEffect(() => {
        const cookies = parseCookies()
        if (!cookies[COOKIE_TOKEN] || cookies[COOKIE_VISTO]) return
        if (router.pathname.startsWith('/login') || router.pathname === '/') return

        setAberto(true)
        setCookie(undefined, COOKIE_VISTO, '1', {
            maxAge: 60 * 60 * 24 * 365 * 10,
            path: '/',
        })
    }, [router.pathname])

    return (
        <KRDBaseModal isOpen={aberto} setClose={() => setAberto(false)} headerOff width={42} height={60}>
            <div className={styles.content}>
                <span className={styles.badge}>Novidade</span>
                <h2>Agora temos integração com o iFood!</h2>
                <p>Com a integração você pode, sem sair do sistema:</p>
                <ul>
                    <li>Gerir o cardápio do iFood (produtos, preços e complementos)</li>
                    <li>Receber e acompanhar os pedidos do iFood direto no sistema</li>
                </ul>
                <p className={styles.destaque}>
                    A integração é <b>gratuita</b>. Entre em contato com o suporte para ativá-la.
                </p>
                <div className={styles.actions}>
                    <button className={styles.secondary} onClick={() => setAberto(false)}>Agora não</button>
                    <a className={styles.primary} href={SUPORTE_URL} target="_blank" rel="noreferrer" onClick={() => setAberto(false)}>
                        Falar com o suporte
                    </a>
                </div>
            </div>
        </KRDBaseModal>
    )
}
