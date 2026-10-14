import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError } from 'axios'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faUserPlus, faKey } from '@fortawesome/free-solid-svg-icons'
import IUsuario from '@/interfaces/IUsuario'
import IUsuarioCaixa from '@/interfaces/IUsuarioCaixa'
import UsuarioCaixaForm from '@/components/Modals/UsuarioCaixa/UsuarioCaixaForm'
import DefinirSenhaWebModal from '@/components/Modals/UsuarioCaixa/DefinirSenhaWebModal'
import { searchHelper } from '@/utils/functions'

type SearchProps = {
    str: string
    edit: number
    senhaWebId: number
}

export default function UsuarioPage() {
    const { getUser } = useContext(AuthContext)

    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IUsuarioCaixa[]>([])
    const [user, setUser] = useState<IUsuario>()
    const [search, setSearch] = useState<SearchProps>({
        str: '',
        edit: -1,
        senhaWebId: -1,
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
            const { data } = await api.get<IUsuarioCaixa[]>(
                `/v2/Usuario/List/${u.empresaSelecionada}`
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
        return list.filter(u =>
            searchHelper(search.str, `${u.nome} ${u.login} ${u.id} ${u.empresaId}`)
        )
    }

    const usuarioSenhaWeb = list.find(u => u.id === search.senhaWebId)

    const columns: KRDColumn<IUsuarioCaixa>[] = [
        {
            name: '',
            cell: usuario => (
                <button
                    className={styles.editBtn}
                    onClick={() => setSearch(prev => ({ ...prev, edit: usuario.id }))}
                >
                    <FontAwesomeIcon icon={faEdit} />
                </button>
            ),
            width: '48px',
        },
        {
            name: 'Cód. Empresa',
            selector: row => row.empresaId,
            sortable: true,
            width: '130px',
        },
        {
            name: 'Nome',
            selector: row => row.nome,
            sortable: true,
        },
        {
            name: 'Login',
            selector: row => row.login,
            sortable: true,
            width: '160px',
        },
        {
            name: 'Local',
            selector: row => row.idUsuario > 0 ? 'Sim' : 'Não',
            cell: row => (
                <span className={row.idUsuario > 0 ? styles.badgeAtivo : styles.badgeInativo}>
                    {row.idUsuario > 0 ? 'Sim' : 'Não'}
                </span>
            ),
            sortable: true,
            width: '90px',
        },
        {
            name: 'Senha Web',
            selector: row => row.temSenhaWeb ? 'Definida' : 'Não definida',
            cell: row => (
                <span className={row.temSenhaWeb ? styles.badgeAtivo : styles.badgeInativo}>
                    {row.temSenhaWeb ? 'Definida' : 'Não definida'}
                </span>
            ),
            sortable: true,
            width: '130px',
        },
        {
            name: 'Ações',
            cell: usuario => (
                <button
                    className={styles.senhaWebBtn}
                    onClick={() => setSearch(prev => ({ ...prev, senhaWebId: usuario.id }))}
                >
                    <FontAwesomeIcon icon={faKey} />
                    Definir senha web
                </button>
            ),
            width: '190px',
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Usuários</h4>
                <div className={styles.headerActions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setSearch(prev => ({ ...prev, edit: 0 }))}
                    >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Novo usuário
                    </button>
                </div>
            </div>

            {/* Barra de busca + contador */}
            <div className={styles.searchBar}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por nome, login ou código..."
                        title=""
                        value={search.str}
                        onChange={e => setSearch(prev => ({ ...prev, str: e.target.value }))}
                    />
                </div>
                {!loading && (
                    <span className={styles.counter}>
                        {getFiltered().length} usuário{getFiltered().length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            <KRDTable<IUsuarioCaixa>
                columns={columns}
                data={getFiltered()}
                loading={loading}
                paginationPerPage={15}
            />

            {(search.edit === 0 || search.edit > 0) && (
                <UsuarioCaixaForm
                    isOpen
                    user={user}
                    classeId={search.edit}
                    setClose={(res) => {
                        if (res) loadData()
                        setSearch(prev => ({ ...prev, edit: -1 }))
                    }}
                />
            )}

            {search.senhaWebId > 0 && usuarioSenhaWeb && (
                <DefinirSenhaWebModal
                    isOpen
                    usuarioId={usuarioSenhaWeb.id}
                    usuarioNome={usuarioSenhaWeb.nome}
                    setClose={() => setSearch(prev => ({ ...prev, senhaWebId: -1 }))}
                />
            )}
        </div>
    )
}