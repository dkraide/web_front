import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faPlus, faPen, faTrash, faSave } from '@fortawesome/free-solid-svg-icons'

import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import CustomButton from '@/components/ui/Buttons'
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial'
import SelectCampoProduto from '@/components/Selects/SelectCampoProduto'
import SelectStatus from '@/components/Selects/SelectStatus'
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm'
import TributacaoForm from '@/components/Modals/Tributacao/TributacaoForm'
import IProduto from '@/interfaces/IProduto'
import IClasseMaterial from '@/interfaces/IClasseMaterial'
import ITributacao from '@/interfaces/ITributacao'
import ICodBarras from '@/interfaces/ICodBarras'
import IUsuario from '@/interfaces/IUsuario'
import { GetCurrencyBRL } from '@/utils/functions'

type Row = IProduto & { _key: string; _dirty?: boolean; _isNew?: boolean }

type RelModal = { id: number; rowKey?: string; prevIds: number[] } | null

let keySeq = 1
const newKey = () => `row-${keySeq++}`

export default function AjusteMassa() {
    const { getUser } = useContext(AuthContext)
    const router = useRouter()

    const [user, setUser] = useState<IUsuario>()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [rows, setRows] = useState<Row[]>([])
    const [classes, setClasses] = useState<IClasseMaterial[]>([])
    const [tributacoes, setTributacoes] = useState<ITributacao[]>([])

    // Modais de cadastro/edicao de classe e tributacao acionados dentro da grade.
    const [classeModal, setClasseModal] = useState<RelModal>(null)
    const [tribModal, setTribModal] = useState<RelModal>(null)

    useEffect(() => {
        boot()
    }, [])

    const boot = async () => {
        const u = await getUser()
        if (!u?.empresaSelecionada) {
            router.push('/login')
            return
        }
        setUser(u)
        try {
            await Promise.all([
                loadProdutos(u.empresaSelecionada),
                loadClasses(u.empresaSelecionada),
                loadTributacoes(u.empresaSelecionada),
            ])
        } finally {
            setLoading(false)
        }
    }

    const loadProdutos = async (empresaId: number) => {
        try {
            const { data } = await api.get<IProduto[]>(`/v2/produto/AjusteMassa?empresaId=${empresaId}`)
            setRows(data.map(p => ({ ...p, _key: newKey(), codBarras: p.codBarras ?? [] })))
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar produtos. ${e.response?.data || e.message}`)
        }
    }

    const loadClasses = async (empresaId: number): Promise<IClasseMaterial[]> => {
        try {
            const { data } = await api.get<IClasseMaterial[]>(`/ClasseMaterial/List?EmpresaId=${empresaId}`)
            setClasses(data)
            return data
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar grupos. ${e.response?.data || e.message}`)
            return []
        }
    }

    const loadTributacoes = async (empresaId: number): Promise<ITributacao[]> => {
        try {
            const { data } = await api.get<ITributacao[]>(`/Tributacao/List?empresaId=${empresaId}`)
            setTributacoes(data)
            return data
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar tributações. ${e.response?.data || e.message}`)
            return []
        }
    }

    // ── edicao de celulas ────────────────────────────────────────────────
    const patchRow = (key: string, patch: Partial<Row>) => {
        setRows(prev => prev.map(r => (r._key === key ? { ...r, ...patch, _dirty: true } : r)))
    }

    const nextCod = () => {
        const max = rows.reduce((m, r) => Math.max(m, Number(r.cod) || 0), 0)
        return max + 1
    }

    const addRow = () => {
        const classe = classes[0]
        const trib = tributacoes[0]
        const row: Row = {
            _key: newKey(),
            _isNew: true,
            _dirty: true,
            id: 0,
            idProduto: 0,
            cod: nextCod(),
            nome: '',
            valorCompra: 0,
            valor: 0,
            status: true,
            visivelMenu: true,
            unidadeCompra: 'UN',
            classeMaterialId: classe?.id ?? 0,
            idClasseMaterial: classe?.idClasseMaterial ?? 0,
            tributacaoId: trib?.id ?? 0,
            idTributacao: trib?.idTributacao ?? 0,
            codBarras: [],
        } as Row
        setRows(prev => [row, ...prev])
    }

    const removeNewRow = (key: string) => {
        setRows(prev => prev.filter(r => r._key !== key))
    }

    // ── modais relacionais ───────────────────────────────────────────────
    const openClasseModal = (rowKey: string | undefined, id: number) =>
        setClasseModal({ id, rowKey, prevIds: classes.map(c => c.id) })

    const openTribModal = (rowKey: string | undefined, id: number) =>
        setTribModal({ id, rowKey, prevIds: tributacoes.map(t => t.id) })

    const closeClasseModal = async (ok?: boolean) => {
        const ctx = classeModal
        setClasseModal(null)
        if (!ok || !user) return
        const list = await loadClasses(user.empresaSelecionada)
        // Novo cadastro: seleciona automaticamente o item criado na linha de origem.
        if (ctx && ctx.id === 0 && ctx.rowKey) {
            const criado = list.find(c => !ctx.prevIds.includes(c.id))
            if (criado) patchRow(ctx.rowKey, { classeMaterialId: criado.id, idClasseMaterial: criado.idClasseMaterial })
        }
    }

    const closeTribModal = async (ok?: boolean) => {
        const ctx = tribModal
        setTribModal(null)
        if (!ok || !user) return
        const list = await loadTributacoes(user.empresaSelecionada)
        if (ctx && ctx.id === 0 && ctx.rowKey) {
            const criado = list.find(t => !ctx.prevIds.includes(t.id))
            if (criado) patchRow(ctx.rowKey, { tributacaoId: criado.id, idTributacao: criado.idTributacao })
        }
    }

    // ── validacao + salvar ───────────────────────────────────────────────
    const validate = (): string | null => {
        const seen = new Map<number, boolean>()
        for (const r of rows) {
            const cod = Number(r.cod) || 0
            if (cod <= 0) return `Produto "${r.nome || '(sem nome)'}" está sem código.`
            if (seen.has(cod)) return `Código ${cod} está duplicado. O código deve ser único (mesmo entre ativos/inativos).`
            seen.set(cod, true)
            if (!r.nome || !r.nome.trim()) return `Existe um produto (cód ${cod}) sem nome.`
            if (!r.classeMaterialId) return `Produto "${r.nome}" está sem grupo de material.`
            if (!r.tributacaoId) return `Produto "${r.nome}" está sem tributação.`
        }
        return null
    }

    const dirtyRows = useMemo(() => rows.filter(r => r._dirty || r._isNew), [rows])

    const handleSave = async () => {
        if (!user) return
        if (dirtyRows.length === 0) {
            toast.info('Nenhuma alteração para salvar.')
            return
        }
        const erro = validate()
        if (erro) {
            toast.error(erro)
            return
        }

        const payload = dirtyRows.map(r => ({
            id: r.id,
            cod: Number(r.cod) || 0,
            nome: (r.nome || '').slice(0, 255),
            valorCompra: r.valorCompra ?? 0,
            valor: r.valor ?? 0,
            status: !!r.status,
            visivelMenu: !!r.visivelMenu,
            unidadeCompra: r.unidadeCompra || 'UN',
            classeMaterialId: r.classeMaterialId ?? 0,
            idClasseMaterial: r.idClasseMaterial ?? 0,
            tributacaoId: r.tributacaoId ?? 0,
            idTributacao: r.idTributacao ?? 0,
            codBarras: (r.codBarras ?? []).map(c => ({ id: c.id ?? 0, codigo: Number(c.codigo) || 0 })),
        }))

        setSaving(true)
        try {
            const { data } = await api.post(`/v2/produto/AjusteMassa?empresaId=${user.empresaSelecionada}`, payload)
            toast.success(`${data} item(ns) salvo(s) com sucesso!`)
            await loadProdutos(user.empresaSelecionada)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao salvar. ${e.response?.data || e.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className={styles.loading}>Carregando produtos...</div>

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <button className={styles.backBtn} onClick={() => router.push('/produto')}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Voltar para produtos
                    </button>
                    <h4 className={styles.title}>Ajuste em massa</h4>
                </div>
            </div>

            {/* 1 — Ajuste por classe (mantém a lógica existente) */}
            <AjustePorClasse empresaId={user?.empresaSelecionada} onDone={() => user && loadProdutos(user.empresaSelecionada)} />

            {/* 2 — Grade editável estilo Excel */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h5>Edição em planilha</h5>
                        <span className={styles.cardHint}>Edite os campos diretamente na grade. As alterações só são gravadas ao clicar em salvar.</span>
                    </div>
                    <div className={styles.gridToolbar}>
                        <CustomButton typeButton="secondary" onClick={addRow}>
                            <FontAwesomeIcon icon={faPlus} /> Novo produto
                        </CustomButton>
                    </div>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.grid}>
                        <thead>
                            <tr>
                                <th className={styles.rowActions}></th>
                                <th className={styles.colCod}>Cód</th>
                                <th className={styles.colNome}>Nome</th>
                                <th className={styles.colMoney}>Valor compra</th>
                                <th className={styles.colMoney}>Valor</th>
                                <th className={styles.colStatus}>Status</th>
                                <th className={styles.colStatus}>Visível menu</th>
                                <th className={styles.colRel}>Grupo de material</th>
                                <th className={styles.colRel}>Tributação</th>
                                <th className={styles.colCod2}>Cód. de barras</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr
                                    key={row._key}
                                    className={row._isNew ? styles.newRow : row._dirty ? styles.dirty : ''}
                                >
                                    <td className={styles.rowActions}>
                                        {row._isNew && (
                                            <button className={styles.removeRowBtn} title="Remover linha" onClick={() => removeNewRow(row._key)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <input
                                            className={`${styles.cellInput} ${styles.right}`}
                                            value={row.cod ?? ''}
                                            inputMode="numeric"
                                            onFocus={e => e.target.select()}
                                            onChange={e => patchRow(row._key, { cod: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className={styles.cellInput}
                                            value={row.nome ?? ''}
                                            maxLength={255}
                                            onFocus={e => e.target.select()}
                                            onChange={e => patchRow(row._key, { nome: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <MoneyCell value={row.valorCompra} onChange={v => patchRow(row._key, { valorCompra: v })} />
                                    </td>
                                    <td>
                                        <MoneyCell value={row.valor} onChange={v => patchRow(row._key, { valor: v })} />
                                    </td>
                                    <td>
                                        <select
                                            className={styles.cellSelect}
                                            value={row.status ? '1' : '0'}
                                            onChange={e => patchRow(row._key, { status: e.target.value === '1' })}
                                        >
                                            <option value="1">Ativo</option>
                                            <option value="0">Inativo</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            className={styles.cellSelect}
                                            value={row.visivelMenu ? '1' : '0'}
                                            onChange={e => patchRow(row._key, { visivelMenu: e.target.value === '1' })}
                                        >
                                            <option value="1">Sim</option>
                                            <option value="0">Não</option>
                                        </select>
                                    </td>
                                    <td>
                                        <RelCell
                                            kind="classe"
                                            options={classes.map(c => ({ id: c.id, label: c.nomeClasse }))}
                                            value={row.classeMaterialId}
                                            onAdd={() => openClasseModal(row._key, 0)}
                                            onEdit={() => openClasseModal(row._key, row.classeMaterialId)}
                                            onSelect={id => {
                                                const c = classes.find(x => x.id === id)
                                                patchRow(row._key, { classeMaterialId: id, idClasseMaterial: c?.idClasseMaterial ?? 0 })
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <RelCell
                                            kind="tributacao"
                                            options={tributacoes.map(t => ({ id: t.id, label: `${t.ncm || 's/ NCM'} - ${t.descricao || ''}` }))}
                                            value={row.tributacaoId}
                                            details={tributacoes.find(t => t.id === row.tributacaoId)}
                                            onAdd={() => openTribModal(row._key, 0)}
                                            onEdit={() => openTribModal(row._key, row.tributacaoId)}
                                            onSelect={id => {
                                                const t = tributacoes.find(x => x.id === id)
                                                patchRow(row._key, { tributacaoId: id, idTributacao: t?.idTributacao ?? 0 })
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <CodBarrasCell
                                            codigos={row.codBarras ?? []}
                                            onChange={list => patchRow(row._key, { codBarras: list })}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={10} className={styles.loading}>Nenhum produto cadastrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.saveBar}>
                    <span className={styles.dirtyCount}>
                        {dirtyRows.length > 0 ? `${dirtyRows.length} alteração(ões) pendente(s)` : 'Sem alterações pendentes'}
                    </span>
                    <CustomButton typeButton="dark" loading={saving} onClick={handleSave}>
                        <FontAwesomeIcon icon={faSave} /> Salvar alterações
                    </CustomButton>
                </div>
            </div>

            {/* Modais */}
            {classeModal && user && (
                <ClasseForm user={user} isOpen classeId={classeModal.id} setClose={closeClasseModal} />
            )}
            {tribModal && user && (
                <TributacaoForm user={user} isOpen id={tribModal.id} setClose={closeTribModal} />
            )}
        </div>
    )
}

/* ── Card do topo: ajuste em massa por classe ───────────────────────────── */
function AjustePorClasse({ empresaId, onDone }: { empresaId?: number; onDone: () => void }) {
    const [classeId, setClasseId] = useState(0)
    const [campo, setCampo] = useState<any>()
    const [valorTexto, setValorTexto] = useState('')
    const [valorBool, setValorBool] = useState<boolean>(true)
    const [valorClasse, setValorClasse] = useState<IClasseMaterial>()
    const [sending, setSending] = useState(false)

    const campoNome = (campo?.nome || '').replaceAll(' ', '').toUpperCase()

    const confirmar = async () => {
        if (classeId <= 0) return toast.error('Selecione uma classe de material')
        if (!campo?.nome) return toast.error('Selecione um campo')

        let value: any = valorTexto
        if (campoNome === 'STATUS') value = valorBool.toString()
        else if (campoNome === 'CLASSEMATERIAL') value = valorClasse?.id

        setSending(true)
        try {
            const { data } = await api.put(`/Produto/AjusteMassa?ClasseMaterialId=${classeId}&Campo=${campoNome}&Valor=${value}`)
            toast.success(`${data} produto(s) ajustado(s) com sucesso!`)
            onDone()
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao enviar ajuste. ${e.response?.data || e.message}`)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div>
                    <h5>Ajustar em massa por classe</h5>
                    <span className={styles.cardHint}>Aplica um mesmo valor a todos os produtos de uma classe de material.</span>
                </div>
            </div>
            <div className={styles.cardBody}>
                <div className={styles.classeForm}>
                    <div className={styles.classeField}>
                        <span>Classe de material</span>
                        <SelectClasseMaterial empresaId={empresaId} selected={classeId} setSelected={c => setClasseId(c?.id ?? 0)} />
                    </div>
                    <div className={styles.classeField}>
                        <span>Campo a alterar</span>
                        <SelectCampoProduto selected={campo?.value} setSelected={setCampo} />
                    </div>
                    <div className={styles.classeField}>
                        <span>Novo valor</span>
                        {campoNome === 'STATUS' ? (
                            <SelectStatus title="" selected={valorBool} setSelected={setValorBool} />
                        ) : campoNome === 'CLASSEMATERIAL' ? (
                            <SelectClasseMaterial empresaId={empresaId} selected={valorClasse?.id ?? 0} setSelected={setValorClasse} />
                        ) : (
                            <input
                                className={styles.cellSelect}
                                placeholder="Valor do ajuste"
                                value={valorTexto}
                                onChange={e => setValorTexto(e.target.value)}
                            />
                        )}
                    </div>
                    <CustomButton typeButton="dark" loading={sending} onClick={confirmar}>
                        Aplicar ajuste
                    </CustomButton>
                </div>
                {campo && (
                    <div className={styles.warning}>
                        Esta ação altera o campo <b>{campo.nome}</b> em <b>todos</b> os produtos da classe selecionada.
                    </div>
                )}
            </div>
        </div>
    )
}

/* ── Célula de moeda (BRL) ──────────────────────────────────────────────── */
function MoneyCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <input
            className={`${styles.cellInput} ${styles.right}`}
            value={GetCurrencyBRL(value ?? 0)}
            inputMode="numeric"
            onFocus={e => e.target.select()}
            onChange={e => {
                const digits = e.target.value.replace(/\D/g, '')
                onChange(digits ? Number(digits) / 100 : 0)
            }}
        />
    )
}

/* ── Célula relacional: [+] [select] [editar] (+ detalhes p/ tributação) ── */
function RelCell({
    kind,
    options,
    value,
    details,
    onAdd,
    onEdit,
    onSelect,
}: {
    kind: 'classe' | 'tributacao'
    options: { id: number; label: string }[]
    value: number
    details?: ITributacao
    onAdd: () => void
    onEdit: () => void
    onSelect: (id: number) => void
}) {
    return (
        <div className={styles.relCell}>
            <div className={styles.relRow}>
                <button className={`${styles.iconBtn} ${styles.add}`} title="Cadastrar novo" onClick={onAdd}>
                    <FontAwesomeIcon icon={faPlus} />
                </button>
                <select className={styles.cellSelect} value={value || 0} onChange={e => onSelect(Number(e.target.value))}>
                    {!value && <option value={0}>Selecione...</option>}
                    {options.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
                <button className={styles.iconBtn} title="Editar selecionado" disabled={!value} onClick={onEdit}>
                    <FontAwesomeIcon icon={faPen} />
                </button>
            </div>
            {kind === 'tributacao' && details && (
                <div className={styles.tribDetails}>
                    <span><b>NCM</b> {details.ncm || '-'}</span>
                    <span><b>CFOP</b> {details.cfop || '-'}</span>
                    <span><b>CST ICMS</b> {details.cstIcms ?? '-'}</span>
                    <span><b>CST PIS</b> {details.cstPis ?? '-'}</span>
                    <span><b>CST COFINS</b> {details.cstCofins ?? '-'}</span>
                </div>
            )}
        </div>
    )
}

/* ── Célula de código de barras (adicionar/remover) ─────────────────────── */
function CodBarrasCell({ codigos, onChange }: { codigos: ICodBarras[]; onChange: (list: ICodBarras[]) => void }) {
    const [novo, setNovo] = useState('')

    const add = () => {
        const cod = novo.replace(/\D/g, '')
        if (!cod) return
        if (codigos.some(c => String(c.codigo) === cod)) {
            toast.error('Este código de barras já está vinculado.')
            return
        }
        onChange([...codigos, { codigo: Number(cod) } as ICodBarras])
        setNovo('')
    }

    const remove = (idx: number) => {
        onChange(codigos.filter((_, i) => i !== idx))
    }

    return (
        <div className={styles.codbarrasCell}>
            {codigos.map((c, i) => (
                <span key={`${c.codigo}-${i}`} className={styles.chip}>
                    {String(c.codigo)}
                    <button title="Remover" onClick={() => remove(i)}>×</button>
                </span>
            ))}
            <input
                className={styles.codbarrasInput}
                placeholder="+ código"
                value={novo}
                inputMode="numeric"
                onChange={e => setNovo(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') add() }}
                onBlur={add}
            />
        </div>
    )
}
