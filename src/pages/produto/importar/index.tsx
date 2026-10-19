import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faFileExcel, faCheck } from '@fortawesome/free-solid-svg-icons'

import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import CustomButton from '@/components/ui/Buttons'
import IUsuario from '@/interfaces/IUsuario'
import { GetCurrencyBRL } from '@/utils/functions'
import {
    importacaoProdutoService,
    IImportacaoAnalise,
    IImportacaoItem,
    IImportacaoOpcao,
    IImportacaoPadroes,
    IImportacaoResultado,
} from '@/services/importacaoProdutoService'

type Etapa = 1 | 2 | 3
const PAGE_SIZE = 100

const padroesIniciais: IImportacaoPadroes = {
    status: true,
    visivelMenu: true,
    valorCompra: 0,
    quantidade: 0,
    unidadeCompra: 'UN',
    classeMaterialId: 0,
    tributacaoId: 0,
    cfop: '5102',
}

const errMsg = (err: unknown) => {
    const e = err as AxiosError
    return typeof e.response?.data === 'string' ? e.response.data : e.message
}

const parseMoney = (v: string) => {
    const d = v.replace(/\D/g, '')
    return d ? Number(d) / 100 : 0
}
const parseQtd = (v: string) => Number(v.replace(',', '.').replace(/[^\d.]/g, '')) || 0

export default function ImportarProdutos() {
    const { getUser } = useContext(AuthContext)
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)

    const [user, setUser] = useState<IUsuario>()
    const [etapa, setEtapa] = useState<Etapa>(1)
    const [loading, setLoading] = useState(false)

    // Etapa 1
    const [arquivo, setArquivo] = useState<File>()
    const [analise, setAnalise] = useState<IImportacaoAnalise>()
    const [mapeamento, setMapeamento] = useState<Record<string, number>>({})
    const [padroes, setPadroes] = useState<IImportacaoPadroes>(padroesIniciais)
    const [classesOpc, setClassesOpc] = useState<IImportacaoOpcao[]>([])
    const [tribsOpc, setTribsOpc] = useState<IImportacaoOpcao[]>([])

    // Etapa 2
    const [itens, setItens] = useState<IImportacaoItem[]>([])
    const [pagina, setPagina] = useState(0)
    const [soAvisos, setSoAvisos] = useState(false)

    // Etapa 3
    const [resultado, setResultado] = useState<IImportacaoResultado>()

    useEffect(() => {
        getUser().then(u => {
            if (!u?.empresaSelecionada) return router.push('/login')
            setUser(u)
        })
    }, [])

    const empresaId = user?.empresaSelecionada ?? 0
    // Campo com coluna vinculada nao precisa de valor padrao.
    const semColuna = (chave: string) => (mapeamento[chave] ?? -1) < 0

    // ── Etapa 1 ──────────────────────────────────────────────────────────
    const carregarOpcoes = async () => {
        const [c, t] = await Promise.all([
            api.get(`/ClasseMaterial/List?EmpresaId=${empresaId}`),
            api.get(`/Tributacao/List?empresaId=${empresaId}`),
        ])
        setClassesOpc((c.data as any[]).map(x => ({ id: x.id, nome: x.nomeClasse })))
        setTribsOpc((t.data as any[]).map(x => ({ id: x.id, nome: `${x.ncm || 's/ NCM'} - ${x.descricao || ''}` })))
    }

    const enviarArquivo = async (file: File) => {
        setArquivo(file)
        setLoading(true)
        try {
            const data = await importacaoProdutoService.analisar(empresaId, file)
            setAnalise(data)
            setMapeamento(data.sugestao)
            await carregarOpcoes()
        } catch (err) {
            setAnalise(undefined)
            toast.error(errMsg(err))
        } finally {
            setLoading(false)
        }
    }

    const gerarPreview = async () => {
        if (!analise) return
        if (mapeamento['nome'] === undefined || mapeamento['nome'] < 0) return toast.error('Vincule a coluna do nome do produto.')
        setLoading(true)
        try {
            const data = await importacaoProdutoService.preview(empresaId, analise.linhas, mapeamento, padroes)
            setItens(data.itens)
            setClassesOpc(data.classes)
            setTribsOpc(data.tributacoes)
            setPagina(0)
            setEtapa(2)
        } catch (err) {
            toast.error(errMsg(err))
        } finally {
            setLoading(false)
        }
    }

    // ── Etapa 2 ──────────────────────────────────────────────────────────
    const patch = (linha: number, p: Partial<IImportacaoItem>) =>
        setItens(prev => prev.map(i => (i.linha === linha ? { ...i, ...p } : i)))

    const visiveis = useMemo(() => (soAvisos ? itens.filter(i => i.avisos.length > 0 && !i.ignorar) : itens), [itens, soAvisos])
    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / PAGE_SIZE))
    const pagItens = visiveis.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE)
    const aImportar = itens.filter(i => !i.ignorar)
    const novasClasses = new Set(aImportar.filter(i => !i.classeMaterialId && i.classeNome?.trim()).map(i => i.classeNome!.trim().toLowerCase())).size
    const novasTribs = new Set(aImportar.filter(i => !i.tributacaoId && i.ncm?.trim()).map(i => i.ncm!.replace(/\D/g, ''))).size
    const pendentes = aImportar.filter(i => (!i.classeMaterialId && !i.classeNome?.trim()) || (!i.tributacaoId && !i.ncm?.trim()) || !i.nome.trim())

    const confirmar = async () => {
        if (aImportar.length === 0) return toast.error('Nenhum produto selecionado para importar.')
        if (pendentes.length > 0) return toast.error(`${pendentes.length} produto(s) sem classe ou tributação. Corrija ou desmarque-os.`)
        setLoading(true)
        try {
            const res = await importacaoProdutoService.confirmar(empresaId, itens)
            setResultado(res)
            setEtapa(3)
        } catch (err) {
            toast.error(errMsg(err))
        } finally {
            setLoading(false)
        }
    }

    const reiniciar = () => {
        setEtapa(1)
        setArquivo(undefined)
        setAnalise(undefined)
        setItens([])
        setResultado(undefined)
        if (fileRef.current) fileRef.current.value = ''
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <button className={styles.backBtn} onClick={() => router.push('/produto')}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Voltar para produtos
                    </button>
                    <h4 className={styles.title}>Importar produtos por planilha</h4>
                </div>
                <div className={styles.steps}>
                    {['1. Planilha e colunas', '2. Revisar produtos', '3. Resultado'].map((t, i) => (
                        <span key={t} className={etapa === i + 1 ? styles.stepActive : etapa > i + 1 ? styles.stepDone : ''}>{t}</span>
                    ))}
                </div>
            </div>

            {/* ───────────── ETAPA 1 ───────────── */}
            {etapa === 1 && (
                <>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h5>Planilha</h5></div>
                        <div className={styles.cardBody}>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden
                                onChange={e => e.target.files?.[0] && enviarArquivo(e.target.files[0])} />
                            <CustomButton typeButton="secondary" loading={loading} onClick={() => fileRef.current?.click()}>
                                <FontAwesomeIcon icon={faFileExcel} /> {arquivo ? 'Trocar planilha' : 'Selecionar planilha (.xlsx, .xls, .csv)'}
                            </CustomButton>
                            {arquivo && analise && (
                                <span className={styles.hint}> {arquivo.name} — {analise.linhas.length} linha(s) de dados, {analise.colunas.length} coluna(s)</span>
                            )}
                            <div className={styles.hint}>Apenas a primeira aba é lida. A primeira linha deve ser o cabeçalho.</div>
                        </div>
                    </div>

                    {analise && (
                        <>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h5>Vincular colunas</h5>
                                    <span className={styles.hint}>Escolha qual coluna da planilha alimenta cada campo do produto.</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.mapGrid}>
                                        {analise.campos.map(c => {
                                            const idx = mapeamento[c.chave] ?? -1
                                            const col = analise.colunas.find(x => x.indice === idx)
                                            return (
                                                <div key={c.chave} className={styles.field}>
                                                    <label>{c.titulo}{c.obrigatorio && ' *'}</label>
                                                    <select value={idx} onChange={e => setMapeamento(m => ({ ...m, [c.chave]: Number(e.target.value) }))}>
                                                        <option value={-1}>— Sem coluna —</option>
                                                        {analise.colunas.map(x => <option key={x.indice} value={x.indice}>{x.nome}</option>)}
                                                    </select>
                                                    {col && <small>ex.: {col.amostra.join(' | ') || '(vazio)'}</small>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h5>Valores padrão</h5>
                                    <span className={styles.hint}>Usados quando o campo não tem coluna vinculada ou a célula está vazia.</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.mapGrid}>
                                        {semColuna('status') && (
                                            <div className={styles.field}>
                                            <label>Status</label>
                                            <select value={padroes.status ? '1' : '0'} onChange={e => setPadroes(p => ({ ...p, status: e.target.value === '1' }))}>
                                                <option value="1">Ativo</option><option value="0">Inativo</option>
                                            </select>
                                        </div>
                                        )}
                                        <div className={styles.field}>
                                            <label>Visível no menu digital</label>
                                            <select value={padroes.visivelMenu ? '1' : '0'} onChange={e => setPadroes(p => ({ ...p, visivelMenu: e.target.value === '1' }))}>
                                                <option value="1">Sim</option><option value="0">Não</option>
                                            </select>
                                        </div>
                                        {semColuna('unidadeCompra') && (
                                            <div className={styles.field}>
                                            <label>Unidade</label>
                                            <input value={padroes.unidadeCompra} maxLength={5} onChange={e => setPadroes(p => ({ ...p, unidadeCompra: e.target.value.toUpperCase() }))} />
                                        </div>
                                        )}
                                        {semColuna('valorCompra') && (
                                            <div className={styles.field}>
                                            <label>Custo</label>
                                            <input className={styles.right} value={GetCurrencyBRL(padroes.valorCompra)} inputMode="numeric"
                                                onChange={e => setPadroes(p => ({ ...p, valorCompra: parseMoney(e.target.value) }))} />
                                        </div>
                                        )}
                                        {semColuna('quantidade') && (
                                            <div className={styles.field}>
                                            <label>Quantidade</label>
                                            <input className={styles.right} value={padroes.quantidade} inputMode="decimal"
                                                onChange={e => setPadroes(p => ({ ...p, quantidade: parseQtd(e.target.value) }))} />
                                        </div>
                                        )}
                                        {semColuna('classe') && (
                                            <div className={styles.field}>
                                            <label>Classe de material</label>
                                            <select value={padroes.classeMaterialId} onChange={e => setPadroes(p => ({ ...p, classeMaterialId: Number(e.target.value) }))}>
                                                <option value={0}>— Nenhuma —</option>
                                                {classesOpc.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                        </div>
                                        )}
                                        {semColuna('ncm') && (
                                            <div className={styles.field}>
                                            <label>Tributação</label>
                                            <select value={padroes.tributacaoId} onChange={e => setPadroes(p => ({ ...p, tributacaoId: Number(e.target.value) }))}>
                                                <option value={0}>— Nenhuma —</option>
                                                {tribsOpc.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                            </select>
                                        </div>
                                        )}
                                        <div className={styles.field}>
                                            <label>CFOP das tributações novas</label>
                                            <input value={padroes.cfop} maxLength={4} onChange={e => setPadroes(p => ({ ...p, cfop: e.target.value.replace(/\D/g, '') }))} />
                                        </div>
                                    </div>
                                    <div className={styles.warning}>
                                        Tributações criadas automaticamente nascem com NCM, CFOP, CST ICMS 102, CST PIS/COFINS 49 e origem 0 (alíquotas zeradas). Revise na tela de tributação antes de emitir notas.
                                    </div>
                                </div>
                            </div>

                            <div className={styles.footer}>
                                <CustomButton typeButton="dark" loading={loading} onClick={gerarPreview}>Continuar e pré-visualizar</CustomButton>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ───────────── ETAPA 2 ───────────── */}
            {etapa === 2 && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h5>Produtos pré-cadastrados</h5>
                            <span className={styles.hint}>
                                {aImportar.length} a importar de {itens.length} · {novasClasses} classe(s) nova(s) · {novasTribs} tributação(ões) nova(s)
                            </span>
                        </div>
                        <label className={styles.check}>
                            <input type="checkbox" checked={soAvisos} onChange={e => { setSoAvisos(e.target.checked); setPagina(0) }} />
                            Mostrar só linhas com avisos
                        </label>
                    </div>
                    <div className={styles.tableWrap}>
                        <table className={styles.grid}>
                            <thead>
                                <tr>
                                    <th>Importar</th><th>Lin.</th><th>Cód</th><th>Nome</th><th>Classe</th><th>NCM / Tributação</th>
                                    <th>Valor</th><th>Custo</th><th>Qtd</th><th>Status</th><th>Avisos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagItens.map(i => (
                                    <tr key={i.linha} className={i.ignorar ? styles.ignored : i.avisos.length ? styles.warnRow : ''}>
                                        <td className={styles.center}><input type="checkbox" checked={!i.ignorar} onChange={e => patch(i.linha, { ignorar: !e.target.checked })} /></td>
                                        <td>{i.linha}</td>
                                        <td><input className={`${styles.cell} ${styles.w60} ${styles.right}`} value={i.cod || ''} inputMode="numeric"
                                            onChange={e => patch(i.linha, { cod: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></td>
                                        <td><input className={`${styles.cell} ${styles.w260}`} value={i.nome} maxLength={255} onChange={e => patch(i.linha, { nome: e.target.value })} /></td>
                                        <td>
                                            <select className={`${styles.cell} ${styles.w180}`} value={i.classeMaterialId}
                                                onChange={e => {
                                                    const id = Number(e.target.value)
                                                    patch(i.linha, { classeMaterialId: id, classeNome: id ? classesOpc.find(c => c.id === id)?.nome : i.classeNome })
                                                }}>
                                                <option value={0}>{i.classeNome?.trim() ? `➕ Criar "${i.classeNome}"` : 'Selecione...'}</option>
                                                {classesOpc.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                            {!i.classeMaterialId && (
                                                <input className={`${styles.cell} ${styles.w180}`} placeholder="Nome da nova classe" value={i.classeNome ?? ''}
                                                    onChange={e => patch(i.linha, { classeNome: e.target.value })} />
                                            )}
                                        </td>
                                        <td>
                                            <select className={`${styles.cell} ${styles.w180}`} value={i.tributacaoId}
                                                onChange={e => patch(i.linha, { tributacaoId: Number(e.target.value) })}>
                                                <option value={0}>{i.ncm?.trim() ? `➕ Criar NCM ${i.ncm}` : 'Selecione...'}</option>
                                                {tribsOpc.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                            </select>
                                            {!i.tributacaoId && (
                                                <input className={`${styles.cell} ${styles.w180}`} placeholder="NCM da nova tributação" value={i.ncm ?? ''} maxLength={8}
                                                    onChange={e => patch(i.linha, { ncm: e.target.value.replace(/\D/g, '') })} />
                                            )}
                                        </td>
                                        <td><input className={`${styles.cell} ${styles.w90} ${styles.right}`} value={GetCurrencyBRL(i.valor)} inputMode="numeric"
                                            onChange={e => patch(i.linha, { valor: parseMoney(e.target.value) })} /></td>
                                        <td><input className={`${styles.cell} ${styles.w90} ${styles.right}`} value={GetCurrencyBRL(i.valorCompra)} inputMode="numeric"
                                            onChange={e => patch(i.linha, { valorCompra: parseMoney(e.target.value) })} /></td>
                                        <td><input className={`${styles.cell} ${styles.w60} ${styles.right}`} value={i.quantidade} inputMode="decimal"
                                            onChange={e => patch(i.linha, { quantidade: parseQtd(e.target.value) })} /></td>
                                        <td>
                                            <select className={styles.cell} value={i.status ? '1' : '0'} onChange={e => patch(i.linha, { status: e.target.value === '1' })}>
                                                <option value="1">Ativo</option><option value="0">Inativo</option>
                                            </select>
                                        </td>
                                        <td className={styles.avisos}>{i.avisos.join(' ')}</td>
                                    </tr>
                                ))}
                                {pagItens.length === 0 && <tr><td colSpan={11} className={styles.center}>Nenhuma linha.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.pager}>
                        <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>‹ Anterior</button>
                        <span>Página {pagina + 1} de {totalPaginas}</span>
                        <button disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Próxima ›</button>
                    </div>
                    <div className={styles.saveBar}>
                        <CustomButton typeButton="secondary" onClick={() => setEtapa(1)}>Voltar</CustomButton>
                        <span className={pendentes.length ? styles.bad : styles.hint}>
                            {pendentes.length ? `${pendentes.length} produto(s) sem classe/tributação` : 'Tudo pronto para importar'}
                        </span>
                        <CustomButton typeButton="dark" loading={loading} onClick={confirmar}>
                            <FontAwesomeIcon icon={faCheck} /> Confirmar importação ({aImportar.length})
                        </CustomButton>
                    </div>
                </div>
            )}

            {/* ───────────── ETAPA 3 ───────────── */}
            {etapa === 3 && resultado && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}><h5>Importação concluída</h5></div>
                    <div className={styles.cardBody}>
                        <ul className={styles.result}>
                            <li><b>{resultado.produtosCriados}</b> produto(s) criado(s)</li>
                            <li><b>{resultado.classesCriadas}</b> classe(s) criada(s)</li>
                            <li><b>{resultado.tributacoesCriadas}</b> tributação(ões) criada(s)</li>
                            <li className={resultado.erros.length ? styles.bad : ''}><b>{resultado.erros.length}</b> erro(s)</li>
                        </ul>
                        {resultado.erros.length > 0 && (
                            <div className={styles.tableWrap}>
                                <table className={styles.grid}>
                                    <thead><tr><th>Linha</th><th>Produto</th><th>Erro</th></tr></thead>
                                    <tbody>
                                        {resultado.erros.map((e, k) => <tr key={k}><td>{e.linha}</td><td>{e.nome}</td><td>{e.mensagem}</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className={styles.footer}>
                            <CustomButton typeButton="secondary" onClick={reiniciar}>Importar outra planilha</CustomButton>
                            <CustomButton typeButton="dark" onClick={() => router.push('/produto')}>Ir para produtos</CustomButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
