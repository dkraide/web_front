export type AutomacaoTipoGatilho = 'ESTOQUE' | 'VENDA_ERRO' | 'VENDA_FINALIZADA'
export type AutomacaoTipoAcao = 'ESTOQUE' | 'EMAIL' | 'APLICATIVO'

export default interface IAutomacao {
    id: number
    idAutomacao: number
    empresaId: number
    createdAt: string
    lastChange: Date
    needChange: boolean

    nome: string
    status: boolean
    tipoGatilho: AutomacaoTipoGatilho
    tipoAcao: AutomacaoTipoAcao
    /** JSON string de IAutomacaoGatilhoEstoque */
    gatilhoMetadata: string
    /** JSON string de IAutomacaoAcaoEstoque */
    acaoMetadata: string
    ordem: number
}

/** Os ids de produto sao os da NUVEM (produtoId). O PDV traduz para o id local ao sincronizar. */
export interface IAutomacaoGatilhoEstoque {
    produtoId: number
    limite: number
}

export interface IAutomacaoAcaoEstoque {
    produtoOrigemId: number
    quantidadeOrigem: number
    produtoDestinoId: number
    quantidadeDestino: number
}
