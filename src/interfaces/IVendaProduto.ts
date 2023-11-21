import IProduto from "./IProduto"
import IPromocao from "./IPromocao"
import IVenda from "./IVenda"

export default interface IVendaProduto{
 idVendaProduto: number
 idVenda: number
 idPromocao: number
 idProduto: number
 venda: IVenda
 produto: IProduto
 promocao: IPromocao
 valorUnitario: number
 valorTotal: number
 valorCompra: number
 quantidade: number
 observacao: string
 nomeProduto: string
 produtoId: number
 vendaId: number
 promocaoId: number
 id: number
 empresaId: number
}