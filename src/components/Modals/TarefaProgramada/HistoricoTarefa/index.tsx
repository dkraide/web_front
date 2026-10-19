import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { api } from '@/services/apiClient'
import BaseModal from '@/components/Modals/Base/Index'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import ITarefaProgramada, { ITarefaRealizacao } from '@/interfaces/ITarefaProgramada'
import styles from './styles.module.scss'

interface props {
    tarefa: ITarefaProgramada
    usuarios: Record<number, string>
    mobile?: boolean
    setClose: () => void
}

export default function HistoricoTarefa({ tarefa, usuarios, mobile, setClose }: props) {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<ITarefaRealizacao[]>([])

    useEffect(() => {
        api.get<ITarefaRealizacao[]>('/v2/TarefaProgramada/Realizacao', {
            params: { empresaId: tarefa.empresaId, tarefaId: tarefa.id },
        })
            .then(({ data }) => setList(data))
            .catch((err: AxiosError) => toast.error(`Erro ao carregar histórico. ${err.response?.data || err.message}`))
            .finally(() => setLoading(false))
    }, [tarefa])

    const columns: KRDColumn<ITarefaRealizacao>[] = [
        {
            name: 'Data',
            selector: r => r.dataExecucao,
            cell: r => new Date(r.dataExecucao).toLocaleDateString('pt-BR'),
            width: '110px',
        },
        {
            name: 'Resultado',
            cell: r => (
                <span className={r.isExecutado ? styles.badgeOk : styles.badgeNo}>
                    {r.isExecutado ? 'Executada' : 'Não executada'}
                </span>
            ),
            width: '140px',
        },
        {
            name: 'Usuário',
            cell: r => (r.usuarioId > 0 ? usuarios[r.usuarioId] ?? `#${r.usuarioId}` : '—'),
            width: '160px',
        },
        { name: 'Observação', cell: r => r.observacao || '—' },
    ]

    return (
        <BaseModal width={mobile ? '95%' : '65%'} height="auto" title={`Histórico - ${tarefa.titulo}`} isOpen setClose={setClose}>
            <div className={styles.container}>
                {mobile ? (
                    loading ? (
                        <p className={styles.empty}>Carregando...</p>
                    ) : list.length === 0 ? (
                        <p className={styles.empty}>Nenhuma realização registrada.</p>
                    ) : (
                        <div className={styles.lista}>
                            {list.map(r => (
                                <div key={r.id} className={`${styles.item} ${r.isExecutado ? styles.itemOk : styles.itemNo}`}>
                                    <div className={styles.itemTop}>
                                        <b>{new Date(r.dataExecucao).toLocaleDateString('pt-BR')}</b>
                                        <span className={r.isExecutado ? styles.badgeOk : styles.badgeNo}>
                                            {r.isExecutado ? 'Executada' : 'Não executada'}
                                        </span>
                                    </div>
                                    <div className={styles.itemUser}>
                                        {r.usuarioId > 0 ? usuarios[r.usuarioId] ?? `#${r.usuarioId}` : 'Sem usuário'}
                                    </div>
                                    {r.observacao && <p className={styles.itemObs}>{r.observacao}</p>}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <KRDTable<ITarefaRealizacao>
                        columns={columns}
                        data={list}
                        loading={loading}
                        paginationPerPage={10}
                        emptyMessage="Nenhuma realização registrada."
                    />
                )}
            </div>
        </BaseModal>
    )
}
