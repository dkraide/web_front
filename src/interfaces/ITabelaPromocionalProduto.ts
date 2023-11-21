import IProduto from "./IProduto"
import ITabelaPromocional from "./ITabelaPromocional"

export default interface ITabelaPromocionalProduto{
     id: number
     idTabelaPromocionalProduto: number
     idTabelaPromocional: number
     tabelaPromocionalId: number
     idProduto: number
     produtoId: number
     valorUnitario: number
     tabelaPromocional: ITabelaPromocional
     produto: IProduto
     empresaId: number
}