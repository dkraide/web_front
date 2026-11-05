import { useCallback, useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { FaBell, FaCog } from 'react-icons/fa'
import { AuthContext } from '@/contexts/AuthContext'
import { api } from '@/services/apiClient'
import INotificacaoApp, { ROTAS_NOTIFICACAO } from '@/interfaces/INotificacaoApp'
import styles from './styles.module.scss'

const POR_PAGINA = 50

export default function Notificacoes() {
    const router = useRouter()
    const { getUser } = useContext(AuthContext)
    const [empresaId, setEmpresaId] = useState(0)
    const [lista, setLista] = useState<INotificacaoApp[]>([])
    const [carregando, setCarregando] = useState(true)
    const [temMais, setTemMais] = useState(false)

    const carregar = useCallback(async (empresa: number, antesDeId = 0) => {
        setCarregando(true)
        try {
            const { data } = await api.get<INotificacaoApp[]>('/NotificacaoApp/Lista', {
                params: { empresaId: empresa, limite: POR_PAGINA, antesDeId },
            })
            setLista(prev => (antesDeId ? [...prev, ...data] : data))
            setTemMais(data.length === POR_PAGINA)
        } catch (err: any) {
            toast.error(`Erro ao carregar notificações. ${err.response?.data || err.message}`)
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        getUser().then(u => {
            const id = u?.empresaSelecionada ?? 0
            setEmpresaId(id)
            if (id) carregar(id)
        })
    }, [])

    async function abrir(n: INotificacaoApp) {
        if (!n.lida) {
            api.post('/NotificacaoApp/Ler', null, { params: { empresaId, id: n.id } }).catch(() => { })
            setLista(prev => prev.map(x => (x.id === n.id ? { ...x, lida: true } : x)))
        }
        const destino = ROTAS_NOTIFICACAO[n.rota ?? '']
        if (destino) router.push(destino)
    }

    async function lerTodas() {
        try {
            await api.post('/NotificacaoApp/LerTodas', null, { params: { empresaId } })
            setLista(prev => prev.map(x => ({ ...x, lida: true })))
        } catch (err: any) {
            toast.error(`Não foi possível marcar como lidas. ${err.response?.data || err.message}`)
        }
    }

    const naoLidas = lista.filter(n => !n.lida).length

    return (
        <>
            <Head><title>Notificações</title></Head>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Notificações</h1>
                        <p>Avisos do sistema sobre financeiro e tarefas.</p>
                    </div>
                    <div className={styles.acoes}>
                        {naoLidas > 0 && (
                            <button className={styles.btnLink} onClick={lerTodas}>Marcar todas como lidas ({naoLidas})</button>
                        )}
                        <Link href="/notificacoes/configuracao" className={styles.btnConfig}><FaCog /> Configurar</Link>
                    </div>
                </div>

                <div className={styles.lista}>
                    {lista.map(n => (
                        <button key={n.id} className={`${styles.card} ${n.lida ? '' : styles.naoLida}`} onClick={() => abrir(n)}>
                            <span className={styles.icone}><FaBell /></span>
                            <span className={styles.texto}>
                                <b>{n.titulo}</b>
                                {n.mensagem && <small>{n.mensagem}</small>}
                            </span>
                            <span className={styles.data}>{new Date(n.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </button>
                    ))}
                    {!carregando && lista.length === 0 && <div className={styles.vazio}>Nenhuma notificação por aqui.</div>}
                    {carregando && <div className={styles.vazio}>Carregando…</div>}
                    {temMais && !carregando && (
                        <button className={styles.btnLink} onClick={() => carregar(empresaId, lista[lista.length - 1].id)}>Carregar mais</button>
                    )}
                </div>
            </div>
        </>
    )
}
