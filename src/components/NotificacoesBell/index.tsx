import { useEffect, useRef, useState } from 'react'
import { FaBell, FaGift } from 'react-icons/fa'
import { NOVIDADES, novidadesNaoVistas } from '@/data/novidades'
import styles from './styles.module.scss'

// Sino de notificacoes do topo. Por ora tem uma notificacao fixa que leva para /novidades.
export default function NotificacoesBell() {
    const [aberto, setAberto] = useState(false)
    const [naoVistas, setNaoVistas] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const atualizar = () => setNaoVistas(novidadesNaoVistas())
        atualizar()
        window.addEventListener('novidades-vistas', atualizar)
        return () => window.removeEventListener('novidades-vistas', atualizar)
    }, [])

    useEffect(() => {
        if (!aberto) return
        const fora = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
        }
        document.addEventListener('mousedown', fora)
        return () => document.removeEventListener('mousedown', fora)
    }, [aberto])

    return (
        <div className={styles.wrap} ref={ref}>
            <button className={styles.sino} onClick={() => setAberto(!aberto)} aria-label="Notificações">
                <FaBell />
                {naoVistas > 0 && <span className={styles.badge}>{naoVistas}</span>}
            </button>
            {aberto && (
                <div className={styles.painel}>
                    <div className={styles.titulo}>Notificações</div>
                    <a href="/novidades" className={styles.item}>
                        <span className={styles.icone}><FaGift /></span>
                        <span>
                            <b>Novidades</b>
                            <small>
                                {NOVIDADES[0].titulo} Veja as últimas atualizações e integrações.
                            </small>
                        </span>
                        {naoVistas > 0 && <i className={styles.ponto} />}
                    </a>
                </div>
            )}
        </div>
    )
}
