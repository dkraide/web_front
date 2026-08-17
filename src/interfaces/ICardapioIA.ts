// Contrato do modulo "Montar cardapio atraves da foto".
// Espelha WEBApi/OpenAI/CardapioIAResponse.cs. A tela recebe este rascunho do
// endpoint ler-cardapio, o usuario edita, e o mesmo objeto volta no criar-cardapio.

export interface IAdicionalItemIA {
    nome: string
    valor: number
}

export interface IGrupoAdicionalIA {
    descricao: string
    minimo: number
    maximo: number
    itens: IAdicionalItemIA[]
}

export interface IIngredienteIA {
    nome: string
    quantidade: number
}

export interface IProdutoCardapioIA {
    nome: string
    classe: string
    descricao: string
    valorVenda: number
    valorCusto: number
    codigo: number
    ncm: string
    cfop: string
    csosn: string
    ingredientes: IIngredienteIA[]
    gruposAdicionais: string[]
}

export interface ICardapioIA {
    tipoDetectado: string
    classes: string[]
    gruposAdicionais: IGrupoAdicionalIA[]
    produtos: IProdutoCardapioIA[]
}

export interface ICriarCardapioResultado {
    total: number
    produtos: { id: number; cod: number; nome: string }[]
    classes: number
    tributacoes: number
    materiasPrimas: number
    gruposAdicionais: number
}

export type TipoCardapio = 'AUTO' | 'LANCHE' | 'PIZZA'
