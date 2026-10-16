export default interface ISetorEstoque {
     id: number
     nome: string
     descricao?: string
     // Identificador na URL publica (unico por empresa)
     slug: string
     status: boolean
     dataCadastro?: string
     quantidadeProdutos?: number
     empresaSlug?: string
     produtos?: ISetorEstoqueProduto[]
}

export interface ISetorEstoqueProduto {
     id: number
     produtoId: number
     posicao: number
     nome: string
     cod: number
     valor: number
     status: boolean
}
