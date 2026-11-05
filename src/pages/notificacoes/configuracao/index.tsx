import { useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { AuthContext } from '@/contexts/AuthContext'
import { api } from '@/services/apiClient'
import { INotificacaoTipo } from '@/interfaces/INotificacaoApp'
import styles from './styles.module.scss'

export default function ConfigNotificacoes() {
    const { getUser } = useContext(AuthContext)
    const [empresaId, setEmpresaId] = useState(0)
    const [tipos, setTipos] = useState<INotificacaoTipo[]>([])
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        getUser().then(async u => {
            const id = u?.empresaSelecionada ?? 0
            setEmpresaId(id)
            if (!id) return
            try {
                const { data } = await api.get<INotificacaoTipo[]>('/NotificacaoApp/Tipos', { params: { empresaId: id } })
                setTipos(data)
            } catch (err: any) {
                toast.error(`Erro ao carregar as opções. ${err.response?.data || err.message}`)
            } finally {
                setCarregando(false)
            }
        })
    }, [])

    async function alterar(tipo: INotificacaoTipo, campo: 'naTela' | 'push', valor: boolean) {
        const anterior = tipos
        const novo = { ...tipo, [campo]: valor }
        setTipos(tipos.map(t => (t.tipo === tipo.tipo ? novo : t)))
        try {
            await api.put('/NotificacaoApp/Preferencia', { tipo: novo.tipo, naTela: novo.naTela, push: novo.push }, { params: { empresaId } })
        } catch (err: any) {
            setTipos(anterior)
            toast.error(`Não foi possível salvar. ${err.response?.data || err.message}`)
        }
    }

    const categorias = Array.from(new Set(tipos.map(t => t.categoria)))

    return (
        <>
            <Head><title>Configurar notificações</title></Head>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Configurar notificações</h1>
                    <p>Escolha o que aparece na tela de notificações e o que chega como alerta (push) no celular.</p>
                    <Link href="/notificacoes">← Voltar às notificações</Link>
                </div>

                {carregando && <div className={styles.vazio}>Carregando…</div>}

                {categorias.map(cat => (
                    <section key={cat} className={styles.secao}>
                        <h2>{cat}</h2>
                        {tipos.filter(t => t.categoria === cat).map(t => (
                            <div key={t.tipo} className={styles.linha}>
                                <div className={styles.texto}>
                                    <b>{t.nome}</b>
                                    <small>{t.descricao}</small>
                                </div>
                                <label className={styles.opcao}>
                                    <input type="checkbox" checked={t.naTela} disabled={t.obrigatorio}
                                        onChange={e => alterar(t, 'naTela', e.target.checked)} />
                                    Na tela
                                </label>
                                <label className={styles.opcao}>
                                    <input type="checkbox" checked={t.push} disabled={t.obrigatorio}
                                        onChange={e => alterar(t, 'push', e.target.checked)} />
                                    Push
                                </label>
                            </div>
                        ))}
                    </section>
                ))}
            </div>
        </>
    )
}
