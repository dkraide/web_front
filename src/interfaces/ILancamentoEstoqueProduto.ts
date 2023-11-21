import IMateriaPrima from "./IMateriaPrima"
import IProduto from "./IProduto"

export default interface ILancamentoEstoqueProduto{
     idLancamentoEstoqueProduto: number
     idLancamentoEstoque: number
     lancamentoEstoqueId: number
     id: number
     idProduto: number
     produtoId: number
     idMateriaPrima: number
     nomeProduto: string
     custoUnitario: number
     quantidade: number
     produto: IProduto
     materiaPrima: IMateriaPrima
     dataLancamento: Date
     isEntrada: boolean
     empresaId: number
     materiaPrimaId: number
}