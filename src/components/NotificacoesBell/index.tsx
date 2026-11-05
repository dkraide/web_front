import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react'
import { FaBell, FaGift, FaCog } from 'react-icons/fa'
import { NOVIDADES, novidadesNaoVistas } from '@/data/novidades'
import { AuthContext } from '@/contexts/AuthContext'
import { api } from '@/services/apiClient'
import INotificacaoApp, { ROTAS_NOTIFICACAO } from '@/interfaces/INotificacaoApp'
import styles from './styles.module.scss'

const INTERVALO_MS = 60_000
const NO_PAINEL = 5

// Sino de notificacoes do topo: avisos do sistema (financeiro, tarefas...) + a fixa de novidades.
export default function NotificacoesBell() {
    const router = useRouter()
    const { getUser } = useContext(AuthContext)
    const [aberto, setAberto] = useState(false)
    const [naoVistas, setNaoVistas] = useState(0)
    const [empresaId, setEmpresaId] = useState(0)
    const [naoLidas, setNaoLidas] = useState(0)
    const [recentes, setRecentes] = useState<INotificacaoApp[]>([])
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const atualizar = () => setNaoVistas(novidadesNaoVistas())
        atualizar()
        window.addEventListener('novidades-vistas', atualizar)
        return () => window.removeEventListener('novidades-vistas', atualizar)
    }, [])

    useEffect(() => {
        getUser().then(u => setEmpresaId(u?.empresaSelecionada ?? 0))
    }, [])

    // Contador a cada minuto (e na troca de empresa); a lista só é buscada ao abrir o painel.
    useEffect(() => {
        if (!empresaId) return
        const carregar = () => {
            api.get('/NotificacaoApp/NaoLidas', { params: { empresaId } })
                .then(({ data }) => setNaoLidas(data.total ?? 0))
                .catch(() => { })
        }
        carregar()
        const timer = setInterval(carregar, INTERVALO_MS)
        return () => clearInterval(timer)
    }, [empresaId])

    useEffect(() => {
        if (!aberto) return
        const fora = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
        }
        document.addEventListener('mousedown', fora)
        return () => document.removeEventListener('mousedown', fora)
    }, [aberto])

    function alternar() {
        const abrir = !aberto
        setAberto(abrir)
        if (abrir && empresaId) {
            api.get('/NotificacaoApp/Lista', { params: { empresaId, limite: NO_PAINEL } })
                .then(({ data }) => setRecentes(data))
                .catch(() => setRecentes([]))
        }
    }

    function abrirNotificacao(n: INotificacaoApp) {
        setAberto(false)
        if (!n.lida) {
            api.post('/NotificacaoApp/Ler', null, { params: { empresaId, id: n.id } })
                .then(() => setNaoLidas(v => Math.max(0, v - 1)))
                .catch(() => { })
        }
        const destino = ROTAS_NOTIFICACAO[n.rota ?? '']
        router.push(destino ?? '/notificacoes')
    }

    const total = naoVistas + naoLidas

    return (
        <div className={styles.wrap} ref={ref}>
            <button className={styles.sino} onClick={alternar} aria-label="Notificações">
                <FaBell />
                {total > 0 && <span className={styles.badge}>{total > 99 ? '99+' : total}</span>}
            </button>
            {aberto && (
                <div className={styles.painel}>
                    <div className={styles.titulo}>
                        <span>Notificações</span>
                        <Link href="/notificacoes/configuracao" className={styles.config} aria-label="Configurar notificações" onClick={() => setAberto(false)}>
                            <FaCog />
                        </Link>
                    </div>
                    {recentes.map(n => (
                        <button key={n.id} className={styles.item} onClick={() => abrirNotificacao(n)}>
                            <span className={styles.icone}><FaBell /></span>
                            <span>
                                <b>{n.titulo}</b>
                                {n.mensagem && <small>{n.mensagem}</small>}
                            </span>
                            {!n.lida && <i className={styles.ponto} />}
                        </button>
                    ))}
                    {recentes.length === 0 && <div className={styles.vazio}>Nenhuma notificação do sistema.</div>}
                    <Link href="/novidades" className={styles.item} onClick={() => setAberto(false)}>
                        <span className={styles.icone}><FaGift /></span>
                        <span>
                            <b>Novidades</b>
                            <small>
                                {NOVIDADES[0].titulo} Veja as últimas atualizações e integrações.
                            </small>
                        </span>
                        {naoVistas > 0 && <i className={styles.ponto} />}
                    </Link>
                    <Link href="/notificacoes" className={styles.rodape} onClick={() => setAberto(false)}>
                        Ver todas as notificações
                    </Link>
                </div>
            )}
        </div>
    )
}
