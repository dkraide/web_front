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
import IUsuario from "@/interfaces/IUsuario"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import { ExportToExcel, GetCurrencyBRL, searchHelper } from "@/utils/functions"

type SearchProps = {
    str: string
    dateIn: string
    dateFim: string
    status: 'todos' | 'aberto' | 'fechado'
}

const fmtData = (d: Date | string) => format(new Date(d.toString()), "dd/MM/yyyy HH:mm")

export default function MovimentoCaixa() {
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loading, setLoading] = useState(true)
    const [caixas, setCaixas] = useState<IMovimentoCaixa[]>([])
    const [showMovimento, setShowMovimento] = useState(0)
    const reqId = useRef(0)
    const [search, setSearch] = useState<SearchProps>({
        str: "",
        dateIn: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        dateFim: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        status: 'todos',
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
            const { data }: AxiosResponse<IMovimentoCaixa[]> = await api.get("/MovimentoCaixa/List", {
                params: { empresaId: u.empresaSelecionada, dataIn: search.dateIn, dataFim: search.dateFim },
            })
            if (id !== reqId.current) return
            setCaixas(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar caixas. ${e.response?.data || e.message}`)
        } finally {
            if (id === reqId.current) setLoading(false)
        }
    }

    // Filtros aplicados no cliente sobre o período carregado (mais recentes primeiro).
    const filtered = useMemo(() => caixas
        .filter(c => {
            if (search.status === 'aberto' && c.status) return false
            if (search.status === 'fechado' && !c.status) return false
            if (search.str && !searchHelper(search.str, `${c.idMovimentoCaixa} ${c.id} ${c.usuario?.nome || ""}`)) return false
            return true
        })
        .sort((a, b) => new Date(b.dataMovimento).getTime() - new Date(a.dataMovimento).getTime()),
        [caixas, search.status, search.str])

    const totais = useMemo(() => ({
        abertos: filtered.filter(c => !c.status).length,
        fechados: filtered.filter(c => c.status).length,
        abertura: filtered.reduce((s, c) => s + c.valorDinheiro, 0),
        fechamento: filtered.filter(c => c.status).reduce((s, c) => s + c.valorDinheiroFinal, 0),
    }), [filtered])

    const handleExcel = () => {
        const cols = [
            { label: "Caixa", key: "caixa" },
            { label: "Usuario", key: "usuario" },
            { label: "Status", key: "status" },
            { label: "Abertura", key: "abertura" },
            { label: "Fechamento", key: "fechamento" },
            { label: "R$ Abertura", key: "valorAbertura" },
            { label: "R$ Fechamento", key: "valorFechamento" },
        ]
        const data = filtered.map(c => ({
            caixa: c.idMovimentoCaixa || c.id,
            usuario: c.usuario?.nome || "--",
            status: c.status ? "FECHADO" : "ABERTO",
            abertura: fmtData(c.dataMovimento),
            fechamento: c.status ? fmtData(c.dataFechamento) : "--",
            valorAbertura: c.valorDinheiro,
            valorFechamento: c.status ? c.valorDinheiroFinal : "",
        }))
        ExportToExcel(cols, data, "Caixas")
    }

    const columns: KRDColumn<IMovimentoCaixa>[] = [
        {
            name: "",
            cell: c => (
                <button className={styles.editBtn} onClick={() => setShowMovimento(c.id)} title="Visualizar caixa">
                    <FontAwesomeIcon icon={faEye} />
                </button>
            ),
            width: "48px",
        },
        {
            name: "Caixa",
            selector: row => row.idMovimentoCaixa || row.id,
            cell: c => <button className={styles.linkBtn} onClick={() => setShowMovimento(c.id)}>{c.idMovimentoCaixa || c.id}</button>,
            sortable: true,
            width: "90px",
        },
        {
            name: "Usuário",
            selector: row => row.usuario?.nome || "--",
            sortable: true,
        },
        {
            name: "Status",
            selector: row => (row.status ? "FECHADO" : "ABERTO"),
            cell: c => <span className={c.status ? styles.badgeNeutro : styles.badgeAberto}>{c.status ? "Fechado" : "Aberto"}</span>,
            sortable: true,
            width: "110px",
        },
        {
            name: "Abertura",
            selector: row => String(row.dataMovimento),
            cell: c => fmtData(c.dataMovimento),
            sortable: true,
        },
        {
            name: "Fechamento",
            selector: row => (row.status ? String(row.dataFechamento) : ""),
            cell: c => (c.status ? fmtData(c.dataFechamento) : "--"),
            sortable: true,
        },
        {
            name: "R$ Abertura",
            selector: row => row.valorDinheiro,
            cell: c => GetCurrencyBRL(c.valorDinheiro),
            sortable: true,
            right: true,
        },
        {
            name: "R$ Fechamento",
            selector: row => (row.status ? row.valorDinheiroFinal : 0),
            cell: c => (c.status ? GetCurrencyBRL(c.valorDinheiroFinal) : "--"),
            sortable: true,
            right: true,
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Caixas</h4>
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
                        placeholder="Filtrar por caixa ou usuário..."
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
                        <span>Status</span>
                        <select value={search.status} onChange={e => setSearch(prev => ({ ...prev, status: e.target.value as SearchProps['status'] }))}>
                            <option value="todos">Todos</option>
                            <option value="aberto">Abertos</option>
                            <option value="fechado">Fechados</option>
                        </select>
                    </div>
                </div>
                <CustomButton onClick={loadData} typeButton="dark" loading={loading}>
                    <FontAwesomeIcon icon={faSearch} /> Pesquisar
                </CustomButton>
                {!loading && (
                    <span className={styles.counter}>
                        {filtered.length} caixa{filtered.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <div className={styles.boxTotais}>
                <BoxInfo value={`${totais.fechados}`} title="Fechados" />
                <BoxInfo value={`${totais.abertos}`} title="Abertos" />
                <BoxInfo value={GetCurrencyBRL(totais.abertura)} title="Total abertura" />
                <BoxInfo value={GetCurrencyBRL(totais.fechamento)} title="Total fechamento" />
            </div>

            <hr className={styles.divider} />

            {mobile ? (
                <div>
                    {!loading && filtered.length === 0 && <div className={styles.vazio}>Sem itens para serem exibidos.</div>}
                    {filtered.map(c => (
                        <div key={c.id} className={styles.item} onClick={() => setShowMovimento(c.id)}>
                            <div className={styles.itemTop}>
                                <b>Caixa {c.idMovimentoCaixa || c.id}</b>
                                <span className={c.status ? styles.badgeNeutro : styles.badgeAberto}>{c.status ? "Fechado" : "Aberto"}</span>
                            </div>
                            <div className={styles.itemGrid}>
                                <span>Abertura<br /><b>{format(new Date(c.dataMovimento), "dd/MM/yy HH:mm")}</b></span>
                                <span>Fechamento<br /><b>{c.status ? format(new Date(c.dataFechamento), "dd/MM/yy HH:mm") : "--"}</b></span>
                                <span>Usuário<br /><b>{c.usuario?.nome || "--"}</b></span>
                                <span>R$ Abertura<br /><b>{GetCurrencyBRL(c.valorDinheiro)}</b></span>
                                <span>R$ Fechamento<br /><b>{c.status ? GetCurrencyBRL(c.valorDinheiroFinal) : "--"}</b></span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <KRDTable<IMovimentoCaixa>
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    paginationPerPage={15}
                />
            )}

            {showMovimento > 0 && <VisualizarMovimento id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => setShowMovimento(0)} />}
        </div>
    )
}
