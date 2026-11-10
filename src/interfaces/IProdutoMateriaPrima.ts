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
     materiaPrima?: IMateriaPrima // legado
     // Insumo = Produto Finalidade MATERIA_PRIMA: idProdutoInsumo = local, produtoInsumoId = nuvem
     idProdutoInsumo: number
     produtoInsumoId: number
     insumo?: { id: number; idProduto: number; nome: string; valorCompra: number; localPath?: string }
     produto: IProduto
     produtoId: number
     materiaPrimaId: number
     empresaId: number
}