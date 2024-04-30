import IProdutoImagem from "./IProdutoImagem"

export default interface IClasseMaterial{
     id: number
     localCriacao: string
     lastChange: Date
     localPath: string
     posicao: number
     visivelMenu: boolean
     idClasseMaterial: number
     nomeClasse: string
     empresaId: number
     status: boolean
     imagem?: IProdutoImagem
}