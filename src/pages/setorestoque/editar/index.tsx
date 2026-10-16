import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import Switch from 'react-switch'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faArrowDown, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { InputGroup } from '@/components/ui/InputGroup'
import CustomButton from '@/components/ui/Buttons'
import Loading from '@/components/Loading'
import SelectProduto from '@/components/Selects/SelectProduto'
import IUsuario from '@/interfaces/IUsuario'
import IProduto from '@/interfaces/IProduto'
import ISetorEstoque, { ISetorEstoqueProduto } from '@/interfaces/ISetorEstoque'
import { fGetNumber } from '@/utils/functions'

export default function EditarSetorEstoque() {
    const router = useRouter()
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [saving, setSaving] = useState(false)
    const [carregado, setCarregado] = useState(false)

    const [setor, setSetor] = useState<ISetorEstoque>({ id: 0, nome: '', descricao: '', slug: '', status: true })
    const [produtos, setProdutos] = useState<ISetorEstoqueProduto[]>([])
    const [selecionado, setSelecionado] = useState<IProduto>()

    const isEdicao = setor.id > 0
    // O backend confere se a empresa é do usuário logado.
    const q = `?empresaId=${user?.empresaSelecionada ?? 0}`

    const carregar = async (id: number, empresa = user?.empresaSelecionada ?? 0) => {
        const { data } = await api.get<ISetorEstoque>(`/SetorEstoque/${id}?empresaId=${empresa}`)
        setSetor(data)
        setProdutos(data.produtos ?? [])
    }

    useEffect(() => {
        if (!router.isReady) return
        ;(async () => {
            const u = await getUser()
            setUser(u)
            try {
                if (router.query.id) await carregar(fGetNumber(router.query.id as string), u.empresaSelecionada)
            } catch (err) {
                const e = err as AxiosError
                toast.error(`Erro ao carregar setor. ${e.response?.data || e.message}`)
            } finally {
                setCarregado(true)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady])

    const salvar = async () => {
        if (!setor.nome.trim()) { toast.error('Informe o nome do setor.'); return }
        setSaving(true)
        try {
            const body = { nome: setor.nome, descricao: setor.descricao, slug: setor.slug, status: setor.status }
            if (isEdicao) {
                await api.put(`/SetorEstoque/${setor.id}${q}`, body)
                toast.success('Setor atualizado.')
                await carregar(setor.id)
            } else {
                const { data } = await api.post<ISetorEstoque>(`/SetorEstoque${q}`, body)
                toast.success('Setor criado. Agora adicione os produtos.')
                await carregar(data.id)
                router.replace({ pathname: router.pathname, query: { id: data.id } }, undefined, { shallow: true })
            }
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao salvar setor. ${e.response?.data || e.message}`)
        } finally {
            setSaving(false)
        }
    }

    // ── produtos do setor (cada ação grava direto no servidor) ──
    const adicionar = async () => {
        if (!selecionado) { toast.warn('Selecione um produto.'); return }
        try {
            await api.post(`/SetorEstoque/${setor.id}/produto${q}`, { produtoId: selecionado.id })
            setSelecionado(undefined)
            await carregar(setor.id)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`${e.response?.data || e.message}`)
        }
    }

    const remover = async (p: ISetorEstoqueProduto) => {
        try {
            await api.delete(`/SetorEstoque/${setor.id}/produto/${p.produtoId}${q}`)
            await carregar(setor.id)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`${e.response?.data || e.message}`)
        }
    }

    const mover = async (index: number, delta: -1 | 1) => {
        const j = index + delta
        if (j < 0 || j >= produtos.length) return
        const nova = [...produtos]
        const tmp = nova[index]
        nova[index] = nova[j]
        nova[j] = tmp
        setProdutos(nova) // otimista
        try {
            await api.put(`/SetorEstoque/${setor.id}/produto/ordem${q}`, nova.map(p => p.produtoId))
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao reordenar. ${e.response?.data || e.message}`)
            carregar(setor.id)
        }
    }

    const urlPublica = isEdicao && setor.empresaSlug
        ? `${api.defaults.baseURL?.replace(/\/$/, '')}/SetorEstoque/publico/${setor.empresaSlug}/${setor.slug}`
        : ''

    if (!carregado) return <Loading />

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>{isEdicao ? 'Editar setor' : 'Novo setor'}</h4>

            <div className={styles.row}>
                <InputGroup
                    width="40%"
                    title="Nome"
                    value={setor.nome}
                    onChange={e => setSetor({ ...setor, nome: e.currentTarget.value })}
                />
                <InputGroup
                    width="30%"
                    title="Identificador na URL (opcional)"
                    value={setor.slug}
                    placeholder="gerado a partir do nome"
                    onChange={e => setSetor({ ...setor, slug: e.currentTarget.value })}
                />
                <div className={styles.switchCell}>
                    <label>Ativo</label>
                    <Switch onColor="#fc4f6b" checked={setor.status} onChange={v => setSetor({ ...setor, status: v })} />
                </div>
            </div>
            <div className={styles.row}>
                <InputGroup
                    width="100%"
                    title="Descrição"
                    value={setor.descricao ?? ''}
                    onChange={e => setSetor({ ...setor, descricao: e.currentTarget.value })}
                />
            </div>

            <div className={styles.buttons}>
                <CustomButton onClick={salvar} loading={saving}>{isEdicao ? 'Salvar' : 'Cadastrar'}</CustomButton>
                <CustomButton typeButton="outline-main" onClick={() => router.push('/setorestoque')}>Voltar</CustomButton>
            </div>

            {isEdicao && (
                <>
                    {urlPublica && (
                        <div className={styles.urlBox}>
                            <span>Endereço do setor (gravar na tag NFC):</span>
                            <code>{urlPublica}</code>
                            <button
                                type="button"
                                className={styles.iconBtn}
                                title="Copiar"
                                onClick={() => { navigator.clipboard.writeText(urlPublica); toast.success('Copiado!') }}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </button>
                        </div>
                    )}

                    <div className={styles.sectionTitle}>Produtos do setor</div>
                    <div className={styles.addRow}>
                        <SelectProduto
                            width="420px"
                            empresaId={user?.empresaSelecionada}
                            selected={selecionado?.id ?? 0}
                            setSelected={setSelecionado}
                            ignore={produtos.map(p => p.produtoId)}
                        />
                        <CustomButton style={{ height: 40 }} onClick={adicionar}>Adicionar</CustomButton>
                    </div>

                    {produtos.length === 0 && <p className={styles.vazio}>Nenhum produto neste setor.</p>}
                    <ol className={styles.lista}>
                        {produtos.map((p, i) => (
                            <li key={p.id}>
                                <span className={styles.pos}>{i + 1}</span>
                                <span className={styles.nome}>{p.cod} - {p.nome}</span>
                                <span className={styles.valor}>R$ {p.valor?.toFixed(2)}</span>
                                <button className={styles.iconBtn} disabled={i === 0} onClick={() => mover(i, -1)} title="Subir">
                                    <FontAwesomeIcon icon={faArrowUp} />
                                </button>
                                <button className={styles.iconBtn} disabled={i === produtos.length - 1} onClick={() => mover(i, 1)} title="Descer">
                                    <FontAwesomeIcon icon={faArrowDown} />
                                </button>
                                <button className={styles.iconBtn} onClick={() => remover(p)} title="Remover do setor">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </div>
    )
}
