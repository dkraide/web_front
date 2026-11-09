import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faFileExcel, faSearch } from "@fortawesome/free-solid-svg-icons"
import { useWindowSize } from "rooks"
import styles from "./styles.module.scss"
import { api } from "@/services/apiClient"
import { AuthContext } from "@/contexts/AuthContext"
import IVenda from "@/interfaces/IVenda"
import IUsuario from "@/interfaces/IUsuario"
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import SelectStatusVenda from "@/components/Selects/SelectStatusVenda"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import { ExportToExcel, GetCurrencyBRL, fGetNumber, searchHelper } from "@/utils/functions"

type SearchProps = {
    str: string
    dateIn: string
    dateFim: string
    movimentoCaixa: string
    status: number
}

export default function Venda() {
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loading, setLoading] = useState(true)
    const [vendas, setVendas] = useState<IVenda[]>([])
    const [showVenda, setShowVenda] = useState(0)
    const [showMovimento, setShowMovimento] = useState(0)
    const reqId = useRef(0)
    const [search, setSearch] = useState<SearchProps>({
        str: "",
        dateIn: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        dateFim: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        movimentoCaixa: "",
        status: 0,
    })

    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 600

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        let u = user
        if (!u) {
            u = await getUser()
            setUser(u)
        }
        const id = ++reqId.current
        setLoading(true)
        try {
            const { data }: AxiosResponse<IVenda[]> = await api.get("/Venda/List", {
                params: {
                    empresaId: u.empresaSelecionada,
                    dataIn: search.dateIn,
                    dataFim: search.dateFim,
                    vendedorId: 0,
                    movimentoCaixa: search.movimentoCaixa,
                    status: search.status,
                },
            })
            if (id !== reqId.current) return
            setVendas(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar vendas. ${e.response?.data || e.message}`)
        } finally {
            if (id === reqId.current) setLoading(false)
        }
    }

    // Filtros aplicados no cliente sobre o período carregado.
    const filtered = useMemo(() => vendas.filter(v => {
        const caixaId = fGetNumber(search.movimentoCaixa)
        if (caixaId > 0 && v.idMovimentoCaixa !== caixaId) return false
        if (search.status > 0 && v.statusVenda !== (search.status == 1)) return false
        if (search.str && !searchHelper(search.str, `${v.idVenda} ${v.usuario?.nome || ""} ${v.estd ? "faturado" : "orcamento"}`)) return false
        return true
    }), [vendas, search.movimentoCaixa, search.status, search.str])

    const totais = useMemo(() => {
        let total = 0, cancelado = 0, faturado = 0
        filtered.forEach(v => {
            if (v.statusVenda) {
                total += v.valorTotal
                if (v.estd) faturado += v.valorTotal
            } else {
                cancelado += v.valorTotal
            }
        })
        return { total, cancelado, faturado }
    }, [filtered])

    const handleExcel = () => {
        const cols = [
            { label: "Venda", key: "venda" },
            { label: "Caixa", key: "caixa" },
            { label: "Data", key: "data" },
            { label: "Usuario", key: "usuario" },
            { label: "Tipo", key: "tipo" },
            { label: "Status", key: "status" },
            { label: "Valor", key: "valor" },
        ]
        const data = filtered.map(v => ({
            venda: v.idVenda,
            caixa: v.idMovimentoCaixa,
            data: format(new Date(v.dataVenda.toString()), "dd/MM/yyyy HH:mm"),
            usuario: v.usuario?.nome || "--",
            tipo: v.estd ? "FATURADO" : "ORCAMENTO",
            status: v.statusVenda ? "OK" : "CANCELADO",
            valor: v.valorTotal,
        }))
        ExportToExcel(cols, data, "Vendas")
    }

    const columns: KRDColumn<IVenda>[] = [
        {
            name: "",
            cell: v => (
                <button className={styles.editBtn} onClick={() => setShowVenda(v.id)} title="Visualizar venda">
                    <FontAwesomeIcon icon={faEye} />
                </button>
            ),
            width: "48px",
        },
        {
            name: "Venda",
            selector: row => row.idVenda,
            cell: v => <button className={styles.linkBtn} onClick={() => setShowVenda(v.id)}>{v.idVenda}</button>,
            sortable: true,
            width: "90px",
        },
        {
            name: "Caixa",
            selector: row => row.idMovimentoCaixa,
            cell: v => <button className={styles.linkBtn} onClick={() => setShowMovimento(v.movimentoCaixaId)}>{v.idMovimentoCaixa}</button>,
            sortable: true,
            width: "90px",
        },
        {
            name: "Data",
            selector: row => String(row.dataVenda),
            cell: v => format(new Date(v.dataVenda.toString()), "dd/MM/yyyy HH:mm"),
            sortable: true,
        },
        {
            name: "Usuário",
            selector: row => row.usuario?.nome || "--",
            sortable: true,
        },
        {
            name: "Tipo",
            selector: row => (row.estd ? "FATURADO" : "ORÇAMENTO"),
            cell: v => <span className={v.estd ? styles.badgeInfo : styles.badgeNeutro}>{v.estd ? "Faturado" : "Orçamento"}</span>,
            sortable: true,
            width: "110px",
        },
        {
            name: "Status",
            selector: row => (row.statusVenda ? "OK" : "CANCELADO"),
            cell: v => <span className={v.statusVenda ? styles.badgeAtivo : styles.badgeDanger}>{v.statusVenda ? "OK" : "Cancelada"}</span>,
            sortable: true,
            width: "110px",
        },
        {
            name: "Valor",
            selector: row => row.valorTotal,
            cell: v => GetCurrencyBRL(v.valorTotal),
            sortable: true,
            right: true,
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Vendas</h4>
                <div className={styles.headerActions}>
                    <button className={styles.actionBtn} onClick={handleExcel}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        Excel
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por venda ou usuário..."
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
                    <SelectStatusVenda width="200px" selected={search.status}
                        setSelected={s => setSearch(prev => ({ ...prev, status: s }))} />
                </div>
                <div className={styles.filterControl}>
                    <InputGroup type="number" title="Caixa" value={search.movimentoCaixa}
                        onChange={e => setSearch(prev => ({ ...prev, movimentoCaixa: e.target.value }))} />
                </div>
                <CustomButton onClick={loadData} typeButton="dark" loading={loading}>
                    <FontAwesomeIcon icon={faSearch} /> Pesquisar
                </CustomButton>
                {!loading && (
                    <span className={styles.counter}>
                        {filtered.length} venda{filtered.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <div className={styles.boxTotais}>
                <BoxInfo value={GetCurrencyBRL(totais.total)} title="Total" />
                <BoxInfo value={GetCurrencyBRL(totais.cancelado)} title="Cancelados" />
                <BoxInfo value={GetCurrencyBRL(totais.faturado)} title="Faturados" />
            </div>

            <hr className={styles.divider} />

            {mobile ? (
                <div>
                    {!loading && filtered.length === 0 && <div className={styles.vazio}>Sem itens para serem exibidos.</div>}
                    {filtered.map(v => (
                        <div key={v.id} className={styles.item} onClick={() => setShowVenda(v.id)}>
                            <div className={styles.itemTop}>
                                <b>Venda {v.idVenda}</b>
                                <span className={v.statusVenda ? styles.badgeAtivo : styles.badgeDanger}>{v.statusVenda ? "OK" : "Cancelada"}</span>
                            </div>
                            <div className={styles.itemGrid}>
                                <span>Data<br /><b>{format(new Date(v.dataVenda), "dd/MM/yy HH:mm")}</b></span>
                                <span>Valor<br /><b>{GetCurrencyBRL(v.valorTotal)}</b></span>
                                <span>Caixa<br /><b>{v.idMovimentoCaixa}</b></span>
                                <span>Usuário<br /><b>{v.usuario?.nome || "--"}</b></span>
                                <span>Tipo<br /><b>{v.estd ? "Faturado" : "Orçamento"}</b></span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <KRDTable<IVenda>
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    paginationPerPage={15}
                />
            )}

            {showVenda > 0 && <Visualizar id={showVenda} isOpen={showVenda > 0} user={user} setClose={(alterou) => { setShowVenda(0); if (alterou) loadData() }} />}
            {showMovimento > 0 && <VisualizarMovimento id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => setShowMovimento(0)} />}
        </div>
    )
}
