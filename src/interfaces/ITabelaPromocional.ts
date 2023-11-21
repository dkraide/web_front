import ITabelaPromocionalProduto from "./ITabelaPromocionalProduto"

export default interface ITabelaPromocional{
 iDTabelaPromocional: number
 id: number
 titulo: string
 quantidadeMinima: number
 status: boolean
 localCriacao: string
 lastChange: Date
 produtos: ITabelaPromocionalProduto[]
 empresaId: number
}