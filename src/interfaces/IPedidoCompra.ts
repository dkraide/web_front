export type StatusPedidoCompra = 'RASCUNHO' | 'ENVIADO' | 'FATURADO' | 'RECEBIDO' | 'CANCELADO'

export interface IPedidoCompraProduto {
    id: number
    pedidoCompraId: number
    empresaId: number
    produtoId: number
    codigoFornecedor?: string
    nomeProduto: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
    quantidadeFaturada: number
    quantidadeRecebida: number
}

export default interface IPedidoCompra {
    id: number
    empresaId: number
    numero: number
    fornecedorId: number
    dataCriacao: string
    dataPrevista?: string | null
    dataEnvio?: string | null
    dataFaturamento?: string | null
    dataRecebimento?: string | null
    status: StatusPedidoCompra
    origem: 'MANUAL' | 'AUTOMATICO'
    observacao?: string | null
    valorProdutos: number
    valorFrete: number
    valorDesconto: number
    valorTotal: number
    notaFiscalDistribuidorId: number
    lancamentoEstoqueId: number
    despesaId: number
    produtos?: IPedidoCompraProduto[]
}
