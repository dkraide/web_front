"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons"
import styles from './styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import IPedidoCompra from "@/interfaces/IPedidoCompra"
import PedidoCompraForm from "@/components/Modals/PedidoCompra"
import { canSSRAuth } from "@/utils/CanSSRAuth"
import { GetCurrencyBRL, searchHelper } from "@/utils/functions"

const fmtData = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : '--')
const CLASSE_STATUS: Record<string, string> = {
    RASCUNHO: styles.badgeNeutro, ENVIADO: styles.badgeAberto, FATURADO: styles.badgeAberto, RECEBIDO: styles.badgeAtivo, CANCELADO: styles.badgeNeutro,
}

export default function PedidoCompra() {
    const [pedidos, setPedidos] = useState<IPedidoCompra[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<IUsuario>()
    const [edit, setEdit] = useState(-1)
    const [search, setSearch] = useState({
        str: '',
        dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        status: '',
    })
    const { getUser } = useContext(AuthContext)
    const reqId = useRef(0)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        let u = user
        if (!u) { u = await getUser(); setUser(u) }
        const id = ++reqId.current
        setLoading(true)
        try {
            const { data }: AxiosResponse<IPedidoCompra[]> = await api.get(
                `/v2/PedidoCompra/${u.empresaSelecionada}/pedidos?dataIn=${search.dateIn}&dataFim=${search.dateFim}&status=${search.status}`)
            if (id === reqId.current) setPedidos(data)
        } catch (err: any) {
            toast.error(`Erro ao buscar pedidos de compra. ${err.response?.data || err.message}`)
        } finally {
            if (id === reqId.current) setLoading(false)
        }
    }

    const filtered = useMemo(() => pedidos.filter(p =>
        !search.str || searchHelper(search.str, `${p.numero} ${p.observacao || ''}`)), [pedidos, search.str])

    const totais = useMemo(() => ({
        abertos: filtered.filter(p => p.status === 'ENVIADO' || p.status === 'FATURADO').length,
        valorAberto: filtered.filter(p => p.status === 'ENVIADO' || p.status === 'FATURADO').reduce((t, p) => t + p.valorTotal, 0),
        recebidos: filtered.filter(p => p.status === 'RECEBIDO').length,
    }), [filtered])

    const columns: KRDColumn<IPedidoCompra>[] = [
        {
            name: '', width: '70px',
            cell: p => <button className={styles.iconBtn} onClick={() => setEdit(p.id)} title="Abrir pedido"><FontAwesomeIcon icon={faEye} /></button>,
        },
        { name: 'Nº', selector: r => r.numero, cell: p => <button className={styles.linkBtn} onClick={() => setEdit(p.id)}>{p.numero}</button>, sortable: true, width: '90px' },
        { name: 'Criado em', selector: r => r.dataCriacao, cell: p => fmtData(p.dataCriacao), sortable: true, width: '130px' },
        { name: 'Previsão', selector: r => r.dataPrevista ?? '', cell: p => fmtData(p.dataPrevista), sortable: true, width: '130px' },
        { name: 'Status', selector: r => r.status, cell: p => <span className={CLASSE_STATUS[p.status]}>{p.status}</span>, sortable: true, width: '140px' },
        { name: 'Origem', selector: r => r.origem, width: '120px' },
        { name: 'Total', selector: r => r.valorTotal, cell: p => GetCurrencyBRL(p.valorTotal), sortable: true, width: '140px' },
        { name: 'Observação', selector: r => r.observacao ?? '', cell: p => <span title={p.observacao ?? ''}>{p.observacao || '--'}</span> },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Pedidos de compra</h4>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={() => setEdit(0)}><FontAwesomeIcon icon={faPlus} /> Novo pedido</button>
                </div>
            </div>

            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup placeholder="Filtrar por número ou observação..." title="" value={search.str}
                        onChange={e => setSearch(prev => ({ ...prev, str: e.target.value }))} />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type="date" title="Início" value={search.dateIn} onChange={e => setSearch(prev => ({ ...prev, dateIn: e.target.value }))} />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type="date" title="Final" value={search.dateFim} onChange={e => setSearch(prev => ({ ...prev, dateFim: e.target.value }))} />
                </div>
                <div className={styles.filterControl}>
                    <div className={styles.selectStatus}>
                        <span>Status</span>
                        <select value={search.status} onChange={e => setSearch(prev => ({ ...prev, status: e.target.value }))}>
                            <option value="">Todos</option>
                            <option value="RASCUNHO">Rascunho</option>
                            <option value="ENVIADO">Enviado</option>
                            <option value="FATURADO">Faturado</option>
                            <option value="RECEBIDO">Recebido</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>
                </div>
                <CustomButton onClick={loadData} typeButton="dark" loading={loading}><FontAwesomeIcon icon={faSearch} /> Pesquisar</CustomButton>
                {!loading && <span className={styles.counter}>{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</span>}
            </div>

            <div className={styles.boxTotais}>
                <BoxInfo value={`${totais.abertos}`} title="Em andamento" />
                <BoxInfo value={GetCurrencyBRL(totais.valorAberto)} title="Valor em andamento" />
                <BoxInfo value={`${totais.recebidos}`} title="Recebidos" />
            </div>

            <hr className={styles.divider} />

            <KRDTable<IPedidoCompra> columns={columns} data={filtered} loading={loading} paginationPerPage={15} />

            {edit >= 0 && user && (
                <PedidoCompraForm user={user} isOpen id={edit} setClose={(v) => { if (v) loadData(); setEdit(-1) }} />
            )}
        </div>
    )
}
export const getServerSideProps = canSSRAuth(async () => ({ props: {} }))
