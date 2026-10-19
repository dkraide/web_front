export type TarefaPeriodo = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'

export const TAREFA_PERIODOS: { value: TarefaPeriodo; label: string }[] = [
    { value: 'DIARIA', label: 'Diária' },
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'QUINZENAL', label: 'Quinzenal' },
    { value: 'MENSAL', label: 'Mensal' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'ANUAL', label: 'Anual' },
]

export default interface ITarefaProgramada {
    id: number
    idTarefaProgramada: number
    empresaId: number
    titulo: string
    descricao?: string
    periodo: TarefaPeriodo
    ultimaRealizacao?: string | null
    proximaRealizacao: string
    /** Id do usuário na nuvem (0 = qualquer usuário). */
    usuarioId: number
    idUsuario: number
    status: boolean
    localCriacao?: string
    lastChange?: string
    needChange?: boolean
}

export interface ITarefaRealizacao {
    id: number
    idTarefaRealizacao: number
    empresaId: number
    tarefaId: number
    usuarioId: number
    idUsuario: number
    dataExecucao: string
    isExecutado: boolean
    observacao?: string
}
