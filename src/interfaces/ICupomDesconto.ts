import ICupomDescontoCliente from "./ICupomDescontoCliente"

export type CupomTipoCalculo = 'VALOR' | 'PERCENTUAL'
export type CupomTipoAplicacao = 'PEDIDO' | 'FRETE'
export type CupomTipoPermissao = 'TODOS' | 'CLIENTE'

export default interface ICupomDesconto {
    id: number
    idCupomDesconto: number
    empresaId: number
    lastChange: Date
    needChange: boolean

    titulo: string
    codigo: string
    tipoCalculo: CupomTipoCalculo
    valor: number
    tipoAplicacao: CupomTipoAplicacao
    permissao: CupomTipoPermissao
    status: boolean
    dataInicio?: string | null
    dataValidade?: string | null
    valorMinimoPedido: number
    descontoMaximo: number
    quantidade: number
    quantidadeUsada: number
    limitePorCliente: number

    clientes: ICupomDescontoCliente[]
}
