import { ISetorProdutoView } from './ISetorPublico'

export default interface ISetorEstoque {
     id: number
     nome: string
     descricao?: string
     status: boolean
     dataCadastro?: string
     quantidadeProdutos?: number
     empresaSlug?: string
     produtos?: ISetorEstoqueProduto[]
}

// Produto dentro do setor (vinculo): inclui o que a vitrine mostra (midias, descricao...).
export interface ISetorEstoqueProduto extends ISetorProdutoView {
     id: number
     posicao: number
     cod: number
     status: boolean
}
