import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError, AxiosResponse } from 'axios'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { toast } from 'react-toastify'
import CustomButton from '@/components/ui/Buttons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faBoxes, faRobot, faPizzaSlice, faUtensils, faBox, faNetworkWired, faSlidersH, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import IUsuario from '@/interfaces/IUsuario'
import IProduto from '@/interfaces/IProduto'
import ProdutoForm from '@/components/Modals/Produto'
import AjusteEmMassa from '@/components/Modals/Produto/AjusteEmMassa'
import { useWindowSize } from 'rooks'
import ProdutoMobile from '@/components/Mobile/Pages/Produto/ProdutoMobile'
import { ExportToExcel, searchHelper } from '@/utils/functions'
import NovoProdutoForm from '@/components/Modals/Produto/NovoProdutoForm'
import EstoqueForm from '@/components/Modals/Produto/EstoqueForm'
import CreateFromIAForm from '@/components/Modals/Produto/CreateFromIAForm'
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
    const [user, setUser] = useState<IUsuario>()
    const [modalIa, setModalIa] = useState(false)
    const [search, setSearch] = useState<SearchProps>({
        str: '',
        edit: -1,
        ajuste: false,
        viewEstoque: 0,
    })

    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 600

    useEffect(() => {
        loadData()
        if (router.isReady && router.query?.query) {
            setSearch(prev => ({ ...prev, str: router.query.query as string }))
        }
    }, [router.isReady])

    const loadData = async () => {
        let u = user
        if (!u) {
            const res = await getUser()
            setUser(res)
            u = res
        }
        try {
            const { data } = await api.get<IProduto[]>(
                `/Produto/List?empresaId=${u.empresaSelecionada}`
            )
            setList(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar dados. ${e.response?.data || e.message}`)
        } finally {
            setLoading(false)
        }
    }

    function getFiltered() {
        return list.filter(p =>
            searchHelper(search.str, `${p.nome} ${p.cod} ${p.id}`)
        )
    }

    const handleEdit = (produto: IProduto) => {
        if (produto.tipo === 'PIZZA') { window.location.href = `/produto/novaPizza?id=${produto.id}`; return }
        if (produto.tipo === 'PRATO') { window.location.href = `/produto/novoPrato?id=${produto.id}`; return }
        window.location.href = `/produto/item?id=${produto.id}`
    }

    function setImage(id: number) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/png, image/jpeg'
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
                .catch(() => { toast.error('Erro ao tentar salvar imagem.'); setLoading(false) })
        }
    }

    const handleExcel = () => {
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
        const data = getFiltered().map(p => ({
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
            cell: ({ localPath, id }) => (
                <div className={styles.imgCell} onClick={() => setImage(id)}>
                    <img
                        src={localPath ?? '/nopic.png'}
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
            width: '70px',
        },
        {
            name: 'Nome',
            selector: row => row.nome,
            sortable: true,
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
            width: '80px',
            right: true,
        },
        {
            name: 'Custo',
            selector: row => row.valorCompra,
            cell: row => `R$ ${row.valorCompra?.toFixed(2)}`,
            sortable: true,
            right: true,
        },
        {
            name: 'Venda',
            selector: row => row.valor,
            cell: row => `R$ ${row.valor?.toFixed(2)}`,
            sortable: true,
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
                handleNovoPrato={() => { window.location.href = '/produto/novoPrato' }}
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
                    <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/item' }}>
                        <FontAwesomeIcon icon={faBox} />
                        Novo produto
                    </button>
                    <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/novaPizza' }}>
                        <FontAwesomeIcon icon={faPizzaSlice} />
                        Nova pizza
                    </button>
                    <button className={styles.actionBtn} onClick={() => { window.location.href = '/produto/novoPrato' }}>
                        <FontAwesomeIcon icon={faUtensils} />
                        Novo prato
                    </button>
                    <button className={styles.actionBtn} onClick={() => setSearch(prev => ({ ...prev, ajuste: true }))}>
                        <FontAwesomeIcon icon={faSlidersH} />
                        Ajuste massa
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
                {!loading && (
                    <span className={styles.counter}>
                        {getFiltered().length} produto{getFiltered().length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            <KRDTable<IProduto>
                columns={columns}
                data={getFiltered()}
                loading={loading}
                paginationPerPage={15}
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
            {search.ajuste && (
                <AjusteEmMassa
                    isOpen
                    setClose={v => { if (v) loadData(); setSearch(prev => ({ ...prev, ajuste: false })) }}
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