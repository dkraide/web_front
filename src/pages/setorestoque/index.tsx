import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import styles from './styles.module.scss'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { searchHelper } from '@/utils/functions'
import ISetorEstoque from '@/interfaces/ISetorEstoque'

export default function SetoresEstoque() {
    const router = useRouter()
    const { getUser } = useContext(AuthContext)
    const [empresaId, setEmpresaId] = useState(0)
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<ISetorEstoque[]>([])
    const [search, setSearch] = useState('')

    const loadData = async () => {
        try {
            const u = await getUser()
            setEmpresaId(u.empresaSelecionada)
            const { data } = await api.get<ISetorEstoque[]>(`/SetorEstoque?empresaId=${u.empresaSelecionada}`)
            setList(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar setores. ${e.response?.data || e.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const excluir = async (s: ISetorEstoque) => {
        if (!confirm(`Excluir o setor "${s.nome}"? Os produtos continuam cadastrados, só saem do setor.`)) return
        try {
            await api.delete(`/SetorEstoque/${s.id}?empresaId=${empresaId}`)
            toast.success('Setor excluído.')
            loadData()
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao excluir. ${e.response?.data || e.message}`)
        }
    }

    const filtered = list.filter(s => searchHelper(search, `${s.nome} ${s.slug} ${s.id}`))

    const columns: KRDColumn<ISetorEstoque>[] = [
        {
            name: '',
            cell: s => (
                <button className={styles.iconBtn} onClick={() => router.push(`/setorestoque/editar?id=${s.id}`)} title="Editar">
                    <FontAwesomeIcon icon={faEdit} />
                </button>
            ),
            width: '48px',
        },
        { name: 'Nome', selector: s => s.nome, sortable: true },
        { name: 'Identificador (URL)', selector: s => s.slug, sortable: true },
        { name: 'Produtos', selector: s => s.quantidadeProdutos, sortable: true, width: '100px', right: true },
        {
            name: 'Status',
            selector: s => (s.status ? 'Ativo' : 'Inativo'),
            cell: s => (
                <span className={s.status ? styles.badgeAtivo : styles.badgeInativo}>{s.status ? 'Ativo' : 'Inativo'}</span>
            ),
            sortable: true,
            width: '90px',
        },
        {
            name: '',
            cell: s => (
                <button className={styles.iconBtn} onClick={() => excluir(s)} title="Excluir">
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            ),
            width: '48px',
        },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Setores de estoque</h4>
                <button className={styles.actionBtn} onClick={() => router.push('/setorestoque/editar')}>
                    <FontAwesomeIcon icon={faPlus} />
                    Novo setor
                </button>
            </div>

            <div className={styles.searchBar}>
                <InputGroup
                    placeholder="Filtrar por nome..."
                    title=""
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <KRDTable<ISetorEstoque> columns={columns} data={filtered} loading={loading} paginationPerPage={15} />
        </div>
    )
}
