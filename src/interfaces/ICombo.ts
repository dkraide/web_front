import IComboItem from "./IComboItem"
import IProdutoImagem from "./IProdutoImagem"

export default interface ICombo{
idCombo: number
codigo: string
descricao: string
localCriacao: string
lastChange: Date
status: boolean
posicao: number
visivelMenu: boolean
localPath: string
itens: IComboItem[]
empresaId: number
id: number
imagem?: IProdutoImagem
}
