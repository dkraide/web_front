import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError } from 'axios'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import IUsuario from '@/interfaces/IUsuario'
import IGrupoAdicional from '@/interfaces/IGrupoAdicional'
import GrupoAdicionalForm from '@/components/Modals/GrupoAdicional/GrupoAdicionalForm'
import { searchHelper } from '@/utils/functions'

const TIPO_LABELS: Record<string, string> = {
    PADRAO: 'Padrão',
    BORDA: 'Borda',
    TAMANHO: 'Tamanho',
    SABOR: 'Sabor',
    MASSA: 'Massa',
}

type SearchProps = {
    str: string
    edit: number
}

export default function GrupoAdicionalPage() {
    const { getUser } = useContext(AuthContext)

    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IGrupoAdicional[]>([])
    const [user, setUser] = useState<IUsuario>()
    const [search, setSearch] = useState<SearchProps>({
        str: '',
        edit: -1,
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        let u = user
        if (!u) {
            const res = await getUser()
            setUser(res)
            u = res
        }
        try {
            const { data } = await api.get<IGrupoAdicional[]>(
                `/v2/GrupoAdicional?empresaId=${u.empresaSelecionada}`
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
        return list.filter(g =>
            searchHelper(search.str, `${g.descricao} ${g.id}`)
        )
    }

    const columns: KRDColumn<IGrupoAdicional>[] = [
        {
            name: '',
            cell: grupo => (
                <button
                    className={styles.editBtn}
                    onClick={() => setSearch(prev => ({ ...prev, edit: grupo.id }))}
                >
                    <FontAwesomeIcon icon={faEdit} />
                </button>
            ),
            width: '48px',
        },
        {
            name: 'Descrição',
            selector: row => row.descricao,
            sortable: true,
        },
        {
            name: 'Tipo',
            selector: row => row.tipo,
            cell: row => (
                <span className={`${styles.tipoBadge} ${styles[`tipo_${row.tipo}`]}`}>
                    {TIPO_LABELS[row.tipo] ?? row.tipo}
                </span>
            ),
            sortable: true,
            width: '110px',
        },
        {
            name: 'Min / Max',
            selector: row => row.minimo,
            cell: row => `${row.minimo} / ${row.maximo}`,
            width: '100px',
            right: true,
        },
        {
            name: 'Itens',
            selector: row => row.itens?.length ?? 0,
            cell: row => row.itens?.length ?? 0,
            width: '80px',
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
            width: '90px',
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Grupos de Adicionais</h4>
                <div className={styles.headerActions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setSearch(prev => ({ ...prev, edit: 0 }))}
                    >
                        <FontAwesomeIcon icon={faLayerGroup} />
                        Novo grupo adicional
                    </button>
                </div>
            </div>

            {/* Barra de busca + contador */}
            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por descrição ou código..."
                        title=""
                        value={search.str}
                        onChange={e => setSearch(prev => ({ ...prev, str: e.target.value }))}
                    />
                </div>
                {!loading && (
                    <span className={styles.counter}>
                        {getFiltered().length} grupo{getFiltered().length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            <KRDTable<IGrupoAdicional>
                columns={columns}
                data={getFiltered()}
                loading={loading}
                paginationPerPage={15}
            />

            {(search.edit === 0 || search.edit > 0) && (
                <GrupoAdicionalForm
                    isOpen
                    id={search.edit}
                    empresaId={user?.empresaSelecionada}
                    setClose={(res) => {
                        if (res) loadData()
                        setSearch(prev => ({ ...prev, edit: -1 }))
                    }}
                />
            )}
        </div>
    )
}