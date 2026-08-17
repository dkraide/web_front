export default interface ICupomDescontoCliente {
    id: number
    idCupomDescontoCliente: number
    empresaId: number
    idCupomDesconto: number
    cupomDescontoId: number
    idCliente: number
    clienteId: number
    // soft delete: false = cliente removido do cupom (mantido p/ auditoria)
    status?: boolean
    lastChange?: Date
    needChange?: boolean
    // apenas para exibicao no formulario (nao vem/nao vai pro backend)
    nomeCliente?: string
}
