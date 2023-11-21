import IMateriaPrima from "./IMateriaPrima"
import IProduto from "./IProduto"

export default interface IProdutoMateriaPrima{
     idProdutoMateriaPrima: number
     idProduto: number
     idMateriaPrima: number
     id: number
     quantidadeMateriaPrima: number
     opcional: boolean
     lastChange: Date
     localCriacao: string
     materiaPrima: IMateriaPrima
     produto: IProduto
     produtoId: number
     materiaPrimaId: number
     empresaId: number
}