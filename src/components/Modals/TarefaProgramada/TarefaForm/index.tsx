import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { api } from '@/services/apiClient'
import BaseModal from '@/components/Modals/Base/Index'
import Loading from '@/components/Loading'
import CustomButton from '@/components/ui/Buttons'
import { InputGroup } from '@/components/ui/InputGroup'
import { SelectBase } from '@/components/Selects/SelectBase'
import IUsuario from '@/interfaces/IUsuario'
import IUsuarioCaixa from '@/interfaces/IUsuarioCaixa'
import ITarefaProgramada, { TAREFA_PERIODOS, TarefaPeriodo } from '@/interfaces/ITarefaProgramada'
import styles from './styles.module.scss'

interface props {
    user?: IUsuario
    tarefa?: ITarefaProgramada | null
    mobile?: boolean
    setClose: (saved?: boolean) => void
}

// Data local (toISOString usaria UTC e viraria o dia a partir das 21h no horário de Brasília).
const hoje = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TarefaForm({ user, tarefa, mobile, setClose }: props) {
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [usuarios, setUsuarios] = useState<IUsuarioCaixa[]>([])

    const [titulo, setTitulo] = useState(tarefa?.titulo ?? '')
    const [descricao, setDescricao] = useState(tarefa?.descricao ?? '')
    const [periodo, setPeriodo] = useState<TarefaPeriodo>(tarefa?.periodo ?? 'DIARIA')
    const [usuarioId, setUsuarioId] = useState(tarefa?.usuarioId ?? 0)
    const [proxima, setProxima] = useState(tarefa?.proximaRealizacao?.slice(0, 10) ?? hoje())
    const [status, setStatus] = useState(tarefa?.status ?? true)

    useEffect(() => {
        if (!user) return
        api.get<IUsuarioCaixa[]>(`/v2/Usuario/List/${user.empresaSelecionada}`)
            .then(({ data }) => setUsuarios(data))
            .catch((err: AxiosError) => toast.error(`Erro ao carregar usuários. ${err.response?.data || err.message}`))
            .finally(() => setLoading(false))
    }, [user])

    const onSubmit = async () => {
        if (!user) return
        if (titulo.trim().length < 3) {
            toast.error('Digite um título de no mínimo 3 caracteres!')
            return
        }
        if (!proxima) {
            toast.error('Informe a data da próxima realização!')
            return
        }
        setSending(true)
        try {
            await api.post('/v2/TarefaProgramada', {
                ...tarefa,
                id: tarefa?.id ?? 0,
                empresaId: user.empresaSelecionada,
                titulo: titulo.trim(),
                descricao,
                periodo,
                usuarioId,
                proximaRealizacao: `${proxima}T00:00:00`,
                status,
            })
            toast.success('Tarefa salva com sucesso!')
            setClose(true)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao salvar tarefa. ${e.response?.data || e.message}`)
        } finally {
            setSending(false)
        }
    }

    const periodos = TAREFA_PERIODOS.map(p => ({ value: p.value, label: p.label }))
    const responsaveis = [
        { value: '0', label: 'Qualquer usuário' },
        ...usuarios.map(u => ({ value: u.id.toString(), label: u.nome })),
    ]
    const situacoes = [
        { value: '1', label: 'Ativa' },
        { value: '0', label: 'Inativa' },
    ]

    return (
        <BaseModal
            width={mobile ? '95%' : '55%'}
            height="auto"
            title={tarefa?.id ? 'Editar tarefa' : 'Nova tarefa'}
            isOpen
            setClose={() => setClose()}
        >
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputGroup
                        title="Título"
                        width="100%"
                        value={titulo}
                        maxLength={150}
                        onChange={e => setTitulo(e.target.value)}
                    />
                    <div className={styles.field}>
                        <label className={styles.label}>Descrição</label>
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            maxLength={1000}
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <SelectBase
                            width="100%"
                            title="Período"
                            datas={periodos}
                            selected={periodo}
                            setSelected={v => setPeriodo(v as TarefaPeriodo)}
                        />
                        <SelectBase
                            width="100%"
                            title="Responsável"
                            datas={responsaveis}
                            selected={usuarioId.toString()}
                            setSelected={v => setUsuarioId(Number(v))}
                        />
                    </div>
                    <div className={styles.row}>
                        <InputGroup
                            title={tarefa?.id ? 'Próxima realização' : 'Primeira realização'}
                            type="date"
                            value={proxima}
                            onChange={e => setProxima(e.target.value)}
                        />
                        <SelectBase
                            width="100%"
                            title="Situação"
                            datas={situacoes}
                            selected={status ? '1' : '0'}
                            setSelected={v => setStatus(v === '1')}
                        />
                    </div>
                    <div className={styles.buttons}>
                        <CustomButton typeButton="secondary" onClick={() => setClose()}>Cancelar</CustomButton>
                        <CustomButton typeButton="dark" loading={sending} onClick={onSubmit}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
