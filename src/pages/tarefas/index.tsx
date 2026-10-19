import { useContext, useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faHistory, faPlus, faBan, faRedo, faUser, faCalendarDay, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useWindowSize } from 'rooks'
import { api } from '@/services/apiClient'
import { AuthContext } from '@/contexts/AuthContext'
import { InputGroup } from '@/components/ui/InputGroup'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import SelectStatus from '@/components/Selects/SelectStatus'
import { SelectBase } from '@/components/Selects/SelectBase'
import TarefaForm from '@/components/Modals/TarefaProgramada/TarefaForm'
import HistoricoTarefa from '@/components/Modals/TarefaProgramada/HistoricoTarefa'
import Confirm from '@/components/Modals/Confirm'
import IUsuario from '@/interfaces/IUsuario'
import IUsuarioCaixa from '@/interfaces/IUsuarioCaixa'
import ITarefaProgramada, { TAREFA_PERIODOS } from '@/interfaces/ITarefaProgramada'
import { searchHelper } from '@/utils/functions'
import styles from './styles.module.scss'

const periodoLabel = (p: string) => TAREFA_PERIODOS.find(x => x.value === p)?.label ?? p
const fmtData = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

export default function Tarefas() {
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<ITarefaProgramada[]>([])
    const [usuarios, setUsuarios] = useState<IUsuarioCaixa[]>([])
    const [search, setSearch] = useState('')
    const [filtroStatus, setFiltroStatus] = useState<boolean | undefined>(true)
    const [filtroPeriodo, setFiltroPeriodo] = useState('')
    const [edit, setEdit] = useState<ITarefaProgramada | null>(null)
    const [novo, setNovo] = useState(false)
    const [historico, setHistorico] = useState<ITarefaProgramada | null>(null)
    const [inativar, setInativar] = useState<ITarefaProgramada | null>(null)

    // Abaixo de 700px a tabela vira lista de cards (sensação de app).
    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const u = user ?? (await getUser())
            setUser(u)
            const [tarefas, users] = await Promise.all([
                api.get<ITarefaProgramada[]>('/v2/TarefaProgramada', { params: { empresaId: u.empresaSelecionada } }),
                api.get<IUsuarioCaixa[]>(`/v2/Usuario/List/${u.empresaSelecionada}`),
            ])
            setList(tarefas.data)
            setUsuarios(users.data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao carregar dados. ${e.response?.data || e.message}`)
        } finally {
            setLoading(false)
        }
    }

    const nomes = useMemo(() => {
        const map: Record<number, string> = {}
        usuarios.forEach(u => { map[u.id] = u.nome })
        return map
    }, [usuarios])

    const filtered = list.filter(t => {
        if (!searchHelper(search, `${t.titulo} ${t.descricao ?? ''}`)) return false
        if (filtroStatus !== undefined && t.status !== filtroStatus) return false
        if (filtroPeriodo && t.periodo !== filtroPeriodo) return false
        return true
    })

    const confirmarInativar = async () => {
        if (!inativar) return
        try {
            await api.delete(`/v2/TarefaProgramada/${inativar.id}`)
            toast.success('Tarefa inativada.')
            loadData()
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao inativar tarefa. ${e.response?.data || e.message}`)
        } finally {
            setInativar(null)
        }
    }

    const agora = new Date()
    const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`

    const columns: KRDColumn<ITarefaProgramada>[] = [
        {
            name: '',
            width: '130px',
            cell: t => (
                <div className={styles.rowActions}>
                    <button className={styles.iconBtn} title="Editar" onClick={() => setEdit(t)}>
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className={styles.iconBtn} title="Histórico" onClick={() => setHistorico(t)}>
                        <FontAwesomeIcon icon={faHistory} />
                    </button>
                    {t.status && (
                        <button className={styles.iconBtn} title="Inativar" onClick={() => setInativar(t)}>
                            <FontAwesomeIcon icon={faBan} />
                        </button>
                    )}
                </div>
            ),
        },
        { name: 'Título', selector: t => t.titulo, sortable: true },
        { name: 'Período', selector: t => periodoLabel(t.periodo), sortable: true, width: '110px' },
        {
            name: 'Responsável',
            selector: t => (t.usuarioId > 0 ? nomes[t.usuarioId] ?? `#${t.usuarioId}` : 'Qualquer usuário'),
            sortable: true,
        },
        {
            name: 'Última',
            selector: t => t.ultimaRealizacao ?? '',
            cell: t => fmtData(t.ultimaRealizacao),
            sortable: true,
            width: '110px',
        },
        {
            name: 'Próxima',
            selector: t => t.proximaRealizacao,
            cell: t => (
                <span className={t.status && t.proximaRealizacao.slice(0, 10) <= hojeStr ? styles.badgeDanger : styles.badgeNeutro}>
                    {fmtData(t.proximaRealizacao)}
                </span>
            ),
            sortable: true,
            width: '110px',
        },
        {
            name: 'Status',
            selector: t => (t.status ? 'Ativa' : 'Inativa'),
            cell: t => <span className={t.status ? styles.badgeAtivo : styles.badgeInativo}>{t.status ? 'Ativa' : 'Inativa'}</span>,
            sortable: true,
            width: '90px',
        },
    ]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Tarefas programadas</h4>
                <button
                    className={`${styles.actionBtn} ${mobile ? styles.actionBtnFull : ''}`}
                    onClick={() => setNovo(true)}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Nova tarefa
                </button>
            </div>

            <div className={`${styles.searchBar} ${mobile ? styles.searchBarMobile : ''}`}>
                <div className={styles.searchInput}>
                    <InputGroup
                        placeholder="Filtrar por título ou descrição..."
                        title=""
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.filterControl}>
                    <SelectBase
                        width={mobile ? '100%' : '160px'}
                        title="Período"
                        datas={[{ value: '', label: 'GERAL' }, ...TAREFA_PERIODOS]}
                        selected={filtroPeriodo}
                        setSelected={v => setFiltroPeriodo(v)}
                    />
                </div>
                <div className={styles.filterControl}>
                    <SelectStatus allowAll width={mobile ? '100%' : '160px'} selected={filtroStatus} setSelected={s => setFiltroStatus(s)} />
                </div>
                {!loading && (
                    <span className={styles.counter}>
                        {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <hr className={styles.divider} />

            {mobile ? (
                loading ? (
                    <div className={styles.mobileEmpty}>Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.mobileEmpty}>Nenhuma tarefa cadastrada.</div>
                ) : (
                    <div className={styles.cardList}>
                        {filtered.map(t => {
                            const vencida = t.status && t.proximaRealizacao.slice(0, 10) <= hojeStr
                            return (
                                <div key={t.id} className={`${styles.card} ${t.status ? '' : styles.cardInativa}`}>
                                    <div className={styles.cardTop}>
                                        <h5 className={styles.cardTitle}>{t.titulo}</h5>
                                        <span className={t.status ? styles.badgeAtivo : styles.badgeInativo}>
                                            {t.status ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>
                                    {t.descricao && <p className={styles.cardDesc}>{t.descricao}</p>}
                                    <div className={styles.cardChips}>
                                        <span className={styles.chip}>
                                            <FontAwesomeIcon icon={faRedo} /> {periodoLabel(t.periodo)}
                                        </span>
                                        <span className={styles.chip}>
                                            <FontAwesomeIcon icon={faUser} />{' '}
                                            {t.usuarioId > 0 ? nomes[t.usuarioId] ?? `#${t.usuarioId}` : 'Qualquer usuário'}
                                        </span>
                                        <span className={vencida ? styles.chipDanger : styles.chip}>
                                            <FontAwesomeIcon icon={faCalendarDay} /> Próxima: {fmtData(t.proximaRealizacao)}
                                        </span>
                                        {t.ultimaRealizacao && (
                                            <span className={styles.chip}>
                                                <FontAwesomeIcon icon={faCheck} /> Última: {fmtData(t.ultimaRealizacao)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button className={styles.cardBtn} onClick={() => setEdit(t)}>
                                            <FontAwesomeIcon icon={faEdit} /> Editar
                                        </button>
                                        <button className={styles.cardBtn} onClick={() => setHistorico(t)}>
                                            <FontAwesomeIcon icon={faHistory} /> Histórico
                                        </button>
                                        {t.status && (
                                            <button className={`${styles.cardBtn} ${styles.cardBtnDanger}`} onClick={() => setInativar(t)}>
                                                <FontAwesomeIcon icon={faBan} /> Inativar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            ) : (
                <KRDTable<ITarefaProgramada>
                    columns={columns}
                    data={filtered}
                    loading={loading}
                    paginationPerPage={15}
                    emptyMessage="Nenhuma tarefa cadastrada."
                />
            )}

            {(novo || edit) && (
                <TarefaForm
                    user={user}
                    tarefa={edit}
                    mobile={mobile}
                    setClose={saved => {
                        setNovo(false)
                        setEdit(null)
                        if (saved) loadData()
                    }}
                />
            )}
            {historico && <HistoricoTarefa tarefa={historico} usuarios={nomes} mobile={mobile} setClose={() => setHistorico(null)} />}
            {inativar && (
                <Confirm
                    isOpen
                    message={`Deseja inativar a tarefa "${inativar.titulo}"? O histórico é mantido.`}
                    setClose={ok => (ok ? confirmarInativar() : setInativar(null))}
                />
            )}
        </div>
    )
}
