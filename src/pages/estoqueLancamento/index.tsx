"use client";

import { useEffect, useMemo, useRef, useState, useContext } from "react"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { useWindowSize } from "rooks"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faRightLeft, faSearch, faPlus, faFileCode, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons"
import styles from './styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque"
import LancamentoEstoqueForm from "@/components/Modals/Produto/LancamentoEstoqueForm"
import { canSSRAuth } from "@/utils/CanSSRAuth"
import { searchHelper } from "@/utils/functions"
import { useRouter } from "next/router";

interface searchProps {
    str: string
    dateIn: string
    dateFim: string
    tipo: 'todos' | 'entrada' | 'saida'
}

const MARCA_REVERSAO = '[REVERSAO'
const ehReversao = (l: ILancamentoEstoque) => (l.comentario || '').startsWith(MARCA_REVERSAO)
const fmtData = (d: Date | string) => format(new Date(d.toString()), 'dd/MM/yyyy HH:mm')

export default function EstoqueLancamento() {

    const [lancamentos, setLancamentos] = useState<ILancamentoEstoque[]>([])
    const [loading, setLoading] = useState(true)
    const [reverting, setReverting] = useState(0)
    const [search, setSearch] = useState<searchProps>({
        str: '',
        dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        tipo: 'todos',
    })
    const [edit, setEdit] = useState(-1)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const router = useRouter();
    const reqId = useRef(0)
    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700

    useEffect(() => {
        loadData();
    }, [])

    const loadData = async () => {
        let u = user
        if (!u) {
            u = await getUser();
            setUser(u);
        }
        const id = ++reqId.current
        setLoading(true)
        try {
            const { data }: AxiosResponse<ILancamentoEstoque[]> = await api.get(
                `/v2/LancamentoEstoque/${u.empresaSelecionada}/lancamentos?dataIn=${search.dateIn}&dataFim=${search.dateFim}&isProduto=true`)
            if (id !== reqId.current) return
            setLancamentos(data);
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar lançamentos. ${e.response?.data || e.message}`);
        } finally {
            if (id === reqId.current) setLoading(false)
        }
    }

    const reverter = async (l: ILancamentoEstoque) => {
        if (!user || reverting) return;
        if (!window.confirm(`Gerar um lançamento contrário ao lançamento ${l.id}? O estoque dos itens será revertido.`)) return;
        setReverting(l.id)
        try {
            await api.post(`/v2/LancamentoEstoque/${user.empresaSelecionada}/lancamentos/${l.id}/Reverter`);
            toast.success('Lançamento revertido.');
            loadData();
        } catch (err: any) {
            toast.error(`Erro ao reverter. ${err.response?.data || err.message}`);
        }
        setReverting(0)
    }

    // Filtros no cliente sobre o período carregado (mais recentes primeiro).
    const filtered = useMemo(() => lancamentos
        .filter(l => {
            if (search.tipo === 'entrada' && !l.isEntrada) return false
            if (search.tipo === 'saida' && l.isEntrada) return false
            if (search.str && !searchHelper(search.str, `${l.id} ${l.idLancamentoEstoque} ${l.idPedido || ''} ${l.comentario || ''}`)) return false
            return true
        })
        .sort((a, b) => new Date(b.dataLancamento).getTime() - new Date(a.dataLancamento).getTime()),
        [lancamentos, search.tipo, search.str])

    const totais = useMemo(() => ({
        entradas: filtered.filter(l => l.isEntrada).length,
        saidas: filtered.filter(l => !l.isEntrada).length,
        reversoes: filtered.filter(ehReversao).length,
    }), [filtered])

    const tipoBadge = (l: ILancamentoEstoque) => (
        <span className={l.isEntrada ? styles.badgeAtivo : styles.badgeAberto}>{l.isEntrada ? 'Entrada' : 'Saída'}</span>
    )

    const comentarioLimpo = (l: ILancamentoEstoque) => (l.comentario || '').replace(/^\[REVERSAO DO LANCAMENTO \d+\]\s*/, '')

    const acoes = (l: ILancamentoEstoque) => (
        <div className={styles.acoes}>
            <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); setEdit(l.id) }} title="Visualizar lançamento">
                <FontAwesomeIcon icon={faEye} />
            </button>
            {!ehReversao(l) && (
                <button className={styles.iconBtn} disabled={reverting === l.id}
                    onClick={e => { e.stopPropagation(); reverter(l) }} title="Reverter lançamento">
                    <FontAwesomeIcon icon={faRightLeft} />
                </button>
            )}
        </div>
    )

    const columns: KRDColumn<ILancamentoEstoque>[] = [
        {
            name: '',
            cell: l => acoes(l),
            width: '90px',
        },
        {
            name: 'Online',
            selector: row => row.id,
            cell: l => <button className={styles.linkBtn} onClick={() => setEdit(l.id)}>{l.id}</button>,
            sortable: true,
            width: '90px',
        },
        {
            name: 'Local',
            selector: row => row.idLancamentoEstoque,
            sortable: true,
            width: '90px',
        },
        {
            name: 'Data',
            selector: row => String(row.dataLancamento),
            cell: l => fmtData(l.dataLancamento),
            sortable: true,
            width: '160px',
        },
        {
            name: 'Tipo',
            selector: row => (row.isEntrada ? 'ENTRADA' : 'SAIDA'),
            cell: l => (
                <>
                    {tipoBadge(l)}
                    {ehReversao(l) && <span className={`${styles.badgeNeutro} ${styles.gapLeft}`}>Reversão</span>}
                </>
            ),
            sortable: true,
            width: '190px',
        },
        {
            name: 'Comentário',
            selector: row => comentarioLimpo(row),
            cell: l => <span className={styles.comentario} title={comentarioLimpo(l)}>{comentarioLimpo(l) || '--'}</span>,
            sortable: true,
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Lançamentos de estoque</h4>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={() => setEdit(0)}>
                        <FontAwesomeIcon icon={faPlus} /> Manual
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push(`/estoqueLancamento/xml`)}>
                        <FontAwesomeIcon icon={faFileCode} /> XML/Excel
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push(`/estoqueLancamento/ia`)}>
                        <FontAwesomeIcon icon={faWandMagicSparkles} /> I.A
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por número ou comentário..."
                        title=""
                        value={search.str}
                        onChange={e => setSearch(prev => ({ ...prev, str: e.target.value }))}
                    />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type="date" title="Início" value={search.dateIn}
                        onChange={e => setSearch(prev => ({ ...prev, dateIn: e.target.value }))} />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type="date" title="Final" value={search.dateFim}
                        onChange={e => setSearch(prev => ({ ...prev, dateFim: e.target.value }))} />
                </div>
                <div className={styles.filterControl}>
                    <div className={styles.selectStatus}>
                        <span>Tipo</span>
                        <select value={search.tipo} onChange={e => setSearch(prev => ({ ...prev, tipo: e.target.value as searchProps['tipo'] }))}>
                            <option value="todos">Todos</option>
                            <option value="entrada">Entradas</option>
                            <option value="saida">Saídas</option>
                        </select>
                    </div>
                </div>
                <CustomButton onClick={loadData} typeButton="dark" loading={loading}>
                    <FontAwesomeIcon icon={faSearch} /> Pesquisar
                </CustomButton>
                {!loading && (
                    <span className={styles.counter}>
                        {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className={styles.boxTotais}>
                <BoxInfo value={`${totais.entradas}`} title="Entradas" />
                <BoxInfo value={`${totais.saidas}`} title="Saídas" />
                <BoxInfo value={`${totais.reversoes}`} title="Reversões" />
            </div>

            <hr className={styles.divider} />

            {mobile ? (
                <div>
                    {!loading && filtered.length === 0 && <div className={styles.vazio}>Sem itens para serem exibidos.</div>}
                    {filtered.map(l => (
                        <div key={l.id} className={styles.item} onClick={() => setEdit(l.id)}>
                            <div className={styles.itemTop}>
                                <b>Lançamento {l.id}</b>
                                <span>
                                    {tipoBadge(l)}
                                    {ehReversao(l) && <span className={`${styles.badgeNeutro} ${styles.gapLeft}`}>Reversão</span>}
                                </span>
                            </div>
                            <div className={styles.itemGrid}>
                                <span>Data<br /><b>{format(new Date(l.dataLancamento), 'dd/MM/yy HH:mm')}</b></span>
                                <span>Local<br /><b>{l.idLancamentoEstoque || '--'}</b></span>
                            </div>
                            {comentarioLimpo(l) && <div className={styles.itemComentario}>{comentarioLimpo(l)}</div>}
                            <div className={styles.itemAcoes}>{acoes(l)}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <KRDTable<ILancamentoEstoque>
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    paginationPerPage={15}
                />
            )}

            {
                (edit >= 0) && <LancamentoEstoqueForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                    if (v) {
                        loadData();
                    }
                    setEdit(-1);
                }} />
            }
        </div >
    )
}
export const getServerSideProps = canSSRAuth(async (ctx) => {
    return {
        props: {

        }
    }
})
