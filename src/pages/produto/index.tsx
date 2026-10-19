import { useContext, useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError, AxiosResponse } from 'axios'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { toast } from 'react-toastify'
import CustomButton from '@/components/ui/Buttons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faBoxes, faRobot, faPizzaSlice, faBox, faNetworkWired, faSlidersH, faFileExcel, faCamera, faTshirt } from '@fortawesome/free-solid-svg-icons'
import IUsuario from '@/interfaces/IUsuario'
import IProduto from '@/interfaces/IProduto'
import ProdutoForm from '@/components/Modals/Produto'
import { useWindowSize } from 'rooks'
import ProdutoMobile from '@/components/Mobile/Pages/Produto/ProdutoMobile'
import { ExportToExcel, searchHelper } from '@/utils/functions'
import NovoProdutoForm from '@/components/Modals/Produto/NovoProdutoForm'
import EstoqueForm from '@/components/Modals/Produto/EstoqueForm'
import CreateFromIAForm from '@/components/Modals/Produto/CreateFromIAForm'
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial'
import SelectStatus from '@/components/Selects/SelectStatus'
import IClasseMaterial from '@/interfaces/IClasseMaterial'
import { useRouter } from 'next/router'

type SearchProps = {
    str: string
    edit: number
    ajuste: boolean
    viewEstoque: number
}

export default function Produto() {
    const { getUser } = useContext(AuthContext)
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IProduto[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(15)
    const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(null)
    const [debouncedStr, setDebouncedStr] = useState('')
    const reqId = useRef(0)
    const [user, setUser] = useState<IUsuario>()
    const [modalIa, setModalIa] = useState(false)
    const [search, setSearch] = useState<SearchProps>({
        str: '',
        edit: -1,
        ajuste: false,
        viewEstoque: 0,
    })

    // Filtros opcionais (opt-in): so aplicam quando o respectivo checkbox esta ligado,
    // preservando o comportamento padrao de listar todos os produtos.
    const [filtroClasse, setFiltroClasse] = useState<IClasseMaterial>()
    const [filtroStatus, setFiltroStatus] = useState<boolean | undefined>(undefined)

    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 600

    // Ramo da empresa: oculta acoes que nao servem ao tipo. Sem valor (sessao
    // antiga / empresa nao migrada) cai em PADRAO, que so mostra o universal.
    const tipoSistema = user?.tipoSistema ?? 'PADRAO'
    const isRestaurante = tipoSistema === 'RESTAURANTE'
    const isLojaRoupa = tipoSistema === 'LOJA_ROUPA'

    useEffect(() => {
        if (router.isReady && router.query?.query) {
            setSearch(prev => ({ ...prev, str: router.query.query as string }))
        }
    }, [router.isReady])

    // Debounce da busca para nao disparar uma requisicao por tecla.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedStr(search.str), 350)
        return () => clearTimeout(t)
    }, [search.str])

    // Qualquer mudanca de filtro volta para a primeira pagina.
    useEffect(() => { setPage(1) }, [debouncedStr, filtroClasse, filtroStatus, mobile])

    useEffect(() => {
        if (!router.isReady) return
        loadData()
    }, [router.isReady, page, perPage, sort, debouncedStr, filtroClasse, filtroStatus, mobile])

    const buildFilters = () => {
        const params: Record<string, string | number | boolean> = {}
        if (filtroClasse && filtroClasse.id > 0) params.classeId = filtroClasse.id
        if (filtroStatus !== undefined) params.status = filtroStatus
        return params
    }

    const loadData = async () => {
        let u = user
        if (!u) {
            const res = await getUser()
            setUser(res)
            u = res
        }
        const id = ++reqId.current
        setLoading(true)
        try {
            if (mobile) {
                // Layout mobile agrupa por classe e precisa da lista completa.
                const { data } = await api.get<IProduto[]>('/Produto/List', {
                    params: { empresaId: u.empresaSelecionada, ...buildFilters() },
                })
                if (id !== reqId.current) return
                setList(data)
                setTotal(data.length)
            } else {
                const { data } = await api.get<{ items: IProduto[]; total: number }>('/Produto/ListPaged', {
                    params: {
                        empresaId: u.empresaSelecionada,
                        page,
                        pageSize: perPage,
                        search: debouncedStr || undefined,
                        sort: sort?.key,
                        desc: sort?.desc ?? false,
                        ...buildFilters(),
                    },
                })
                if (id !== reqId.current) return
                setList(data.items)
                setTotal(data.total)
            }
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar dados. ${e.response?.data || e.message}`)
        } finally {
            if (id === reqId.current) setLoading(false)
        }
    }

    const handleEdit = (produto: IProduto) => {
        if (produto.tipo === 'PIZZA') { window.location.href = `/produto/novaPizza?id=${produto.id}`; return }
        if (produto.tipo === 'ROUPA') { window.location.href = `/produto/novaRoupa?id=${produto.id}`; return }
        window.location.href = `/produto/item?id=${produto.id}`
    }

    function setImage(id: number) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/png, image/jpeg, image/webp'
        input.click()
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement
            const files = target.files as FileList
            const form = new FormData()
            form.append('file', files[0], files[0].name)
            setLoading(true)
            await api
                .post(`/Produto/${id}/UploadImagem`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then(() => loadData())
                .catch((ex) => { toast.error('Erro ao tentar salvar imagem.' + ex.response?.data || ex.message); setLoading(false) })
        }
    }

    const handleExcel = async () => {
        if (!user) return
        let all: IProduto[] = []
        try {
            const { data } = await api.get<IProduto[]>('/Produto/List', {
                params: { empresaId: user.empresaSelecionada, ...buildFilters() },
            })
            all = data.filter(p => searchHelper(search.str, `${p.nome} ${p.cod} ${p.id}`))
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao exportar. ${e.response?.data || e.message}`)
            return
        }
        const cols = [
            { label: 'Cod', key: 'cod' },
            { label: 'Nome', key: 'nome' },
            { label: 'Estoque', key: 'quantidade' },
            { label: 'Custo', key: 'valorCompra' },
            { label: 'Venda', key: 'valor' },
            { label: 'Status', key: 'status' },
            { label: 'Lucro', key: 'lucro' },
            { label: 'Markup', key: 'markup' },
        ]
        const data = all.map(p => ({
            cod: p.cod,
            nome: p.nome,
            quantidade: p.quantidade,
            valorCompra: p.valorCompra,
            valor: p.valor,
            status: p.status ? 'Ativo' : 'Inativo',
            lucro: ((p.valor - p.valorCompra) / p.valor * 100).toFixed(2) + '%',
            markup: ((p.valor - p.valorCompra) / p.valorCompra * 100).toFixed(2) + '%',
        }))
        ExportToExcel(cols, data, 'Produtos')
    }

    const columns: KRDColumn<IProduto>[] = [
        {
            name: '',
            cell: produto => (
                <button className={styles.editBtn} onClick={() => handleEdit(produto)}>
                    <FontAwesomeIcon icon={faEdit} />
                </button>
            ),
            width: '48px',
        },
        {
            name: 'Imagem',
            // Foto principal (cadastro) ou, sem ela, a primeira da galeria de mídias.
            cell: ({ localPath, capaMidia, id }) => (
                <div className={styles.imgCell} onClick={() => setImage(id)}>
                    <img
                        src={localPath || capaMidia || '/nopic.png'}
                        onError={e => { e.currentTarget.src = '/nopic.png' }}
                        className={styles.produtoImg}
                    />
                </div>
            ),
            width: '90px',
        },
        {
            name: 'Cód',
            selector: row => row.cod,
            sortable: true,
            sortKey: 'cod',
            width: '70px',
        },
        {
            name: 'Nome',
            selector: row => row.nome,
            sortable: true,
            sortKey: 'nome',
        },
        {
            name: 'Estoque',
            selector: row => row.quantidade,
            cell: row => (
                <button
                    className={styles.estoqueBtn}
                    onClick={() => setSearch(prev => ({ ...prev, viewEstoque: row.id }))}
                >
                    {row.quantidade}
                </button>
            ),
            sortable: true,
            sortKey: 'quantidade',
            width: '80px',
            right: true,
        },
        {
            name: 'Custo',
            selector: row => row.valorCompra,
            cell: row => `R$ ${row.valorCompra?.toFixed(2)}`,
            sortable: true,
            sortKey: 'valorCompra',
            right: true,
        },
        {
            name: 'Venda',
            selector: row => row.valor,
            cell: row => `R$ ${row.valor?.toFixed(2)}`,
            sortable: true,
            sortKey: 'valor',
            right: true,
        },
        {
            name: 'Status',
            selector: row => row.status ? 'Ativo' : 'Inativo',
            cell: row => (
                <span className={row.status ? styles.badgeAtivo : styles.badgeInativo}>
                    {row.status ? 'Ativo' : 'Inativo'}
                </span>
            ),
            sortable: true,
            sortKey: 'status',
            width: '80px',
        },
        {
            name: 'Lucro %',
            selector: row => row.valor > 0 ? ((row.valor - row.valorCompra) / row.valor) * 100 : 0,
            cell: row => {
                const pct = row.valor > 0 ? ((row.valor - row.valorCompra) / row.valor) * 100 : 0
                return (
                    <span className={pct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                        {pct.toFixed(1)}%
                    </span>
                )
            },
            sortable: true,
            sortKey: 'lucro',
            right: true,
        },
        {
            name: 'Markup %',
            selector: row => row.valorCompra > 0 ? ((row.valor - row.valorCompra) / row.valorCompra) * 100 : 0,
            cell: row => {
                const mk = row.valorCompra > 0 ? ((row.valor - row.valorCompra) / row.valorCompra) * 100 : 0
                return <span className={styles.badgeNeutro}>{mk.toFixed(1)}%</span>
            },
            sortable: true,
            sortKey: 'markup',
            right: true,
        },
    ]

    if (mobile) {
        return (
            <ProdutoMobile
                produtos={list}
                user={user}
                loadData={loadData}
                handleNovaPizza={() => { window.location.href = '/produto/novaPizza' }}
            />
        )
    }

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Produtos</h4>
                <div className={styles.headerActions}>
                    <button className={`${styles.actionBtn} ${styles.actionBtnIa}`} onClick={() => setModalIa(true)}>
                        <FontAwesomeIcon icon={faRobot} />
                        Cadastrar com I.A
                    </button>
                    {isRestaurante && (
                        <button className={`${styles.actionBtn} ${styles.actionBtnIa}`} onClick={() => { window.location.href = '/produto/novo/cardapio' }}>
                            <FontAwesomeIcon icon={faCamera} />
                            Criar por foto do cardápio
                        </button>
                    )}
                    <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/item' }}>
                        <FontAwesomeIcon icon={faBox} />
                        Novo produto
                    </button>
                    {isRestaurante && (
                        <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/novaPizza' }}>
                            <FontAwesomeIcon icon={faPizzaSlice} />
                            Nova pizza
                        </button>
                    )}
                    {isLojaRoupa && (
                        <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/novaRoupa' }}>
                            <FontAwesomeIcon icon={faTshirt} />
                            Nova roupa
                        </button>
                    )}
                    <button className={styles.actionBtn} onClick={() => router.push('/produto/ajuste-massa')}>
                        <FontAwesomeIcon icon={faSlidersH} />
                        Ajuste massa
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push('/produto/importar')}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        Importar planilha
                    </button>
                    <button className={styles.actionBtn} onClick={handleExcel}>
                        <FontAwesomeIcon icon={faFileExcel} />
                        Excel
                    </button>
                </div>
            </div>

            {/* Barra de busca + contador */}
            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por nome ou código..."
                        title=""
                        value={search.str}
                        onChange={e => setSearch(prev => ({ ...prev, str: e.target.value }))}
                    />
                </div>
                <div className={styles.filterControl}>
                    <SelectClasseMaterial
                        allowAll
                        width="220px"
                        empresaId={user?.empresaSelecionada}
                        selected={filtroClasse?.id ?? 0}
                        setSelected={c => setFiltroClasse(c)}
                    />
                </div>
                <div className={styles.filterControl}>
                    <SelectStatus
                        allowAll
                        width="160px"
                        selected={filtroStatus}
                        setSelected={s => setFiltroStatus(s)}
                    />
                </div>
                {!loading && (
                    <span className={styles.counter}>
                        {total} produto{total !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            <KRDTable<IProduto>
                columns={columns}
                data={list}
                loading={loading}
                serverSide={{
                    total,
                    page,
                    perPage,
                    sort,
                    onPageChange: setPage,
                    onPerPageChange: setPerPage,
                    onSortChange: setSort,
                }}
            />

            {/* Modals */}
            {search.edit === 0 && (
                <NovoProdutoForm
                    user={user}
                    isOpen
                    setClose={v => { if (v) loadData(); setSearch(prev => ({ ...prev, edit: -1 })) }}
                />
            )}
            {search.edit > 0 && (
                <ProdutoForm
                    user={user}
                    isOpen
                    id={search.edit}
                    setClose={v => { if (v) loadData(); setSearch(prev => ({ ...prev, edit: -1 })) }}
                />
            )}
            {search.viewEstoque > 0 && (
                <EstoqueForm
                    user={user}
                    id={search.viewEstoque}
                    isOpen
                    setClose={v => { if (v) loadData(); setSearch(prev => ({ ...prev, viewEstoque: 0 })) }}
                />
            )}
            {modalIa && (
                <CreateFromIAForm
                    user={user}
                    setClose={res => { setModalIa(false); if (res) router.push(`/produto/item?id=${res}`) }}
                />
            )}
        </div>
    )
}