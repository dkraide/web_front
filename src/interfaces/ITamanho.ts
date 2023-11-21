import IProduto from "./IProduto"
import ITamanhoMateriaPrima from "./ITamanhoMateriaPrima"

export default interface ITamanho{
         idTamanho: number 
         id: number 
         nome: string 
         localCriacao: string 
         lastChange: Date
         produto: IProduto 
         idProduto: number 
         produtoId: number 
         empresaId: number 
         valorVenda: number 
         valorCusto: number 
         isChange: boolean
         materiaPrimas: ITamanhoMateriaPrima[]
}