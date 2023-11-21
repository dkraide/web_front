import IFormaPagamento from "./IFormaPagamento"
import IVenda from "./IVenda"

export default interface IVendaPagamento{
     idPagamento: number
     venda: IVenda
     idVenda: number
     idFormaPagamento: number
     forma: IFormaPagamento
     valor: number
     valorJuros: number
     id: number
     vendaId: number
     formaPagamentoId: number
     descricao: string
     empresaId: number
}