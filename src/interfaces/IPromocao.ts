import IClasseMaterial from "./IClasseMaterial"
import IProduto from "./IProduto"
import IProdutoImagem from "./IProdutoImagem"

export default interface IPromocao{
         idPromocao: number
         id: number
         dataFinal: Date
         valorFinal: number
         quantidade: number
         status: boolean
         classeMaterial: IClasseMaterial
         idClasseMaterial: number
         classeMaterialId: number
         produto: IProduto
         idProduto: number
         produtoId: number
         empresaId: number
         localCriacao: string
         lastChange: Date
         localPath: string
         posicao: number
         visivelMenu: boolean
         diaSemana: number
         imagem?: IProdutoImagem
}