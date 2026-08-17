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

// ── Pizzas ──────────────────────────────────────────────────────────
// Cada IPizzaCardapioIA vira um Produto Tipo="PIZZA" com os 4 grupos
// obrigatorios (TAMANHO, MASSA, SABOR, BORDA). Espelha PizzaCardapioIA.cs.

export interface IPrecoTamanhoIA {
    tamanho: string // casa com ITamanhoIA.nome
    valor: number
}

export interface ITamanhoIA {
    nome: string
    qtdSabores: number
}

export interface IMassaIA {
    nome: string
    valor: number
}

export interface IBordaIA {
    nome: string
    precos: IPrecoTamanhoIA[]
}

export interface ISaborIA {
    nome: string
    descricao: string
    precos: IPrecoTamanhoIA[]
}

export interface IPizzaCardapioIA {
    nome: string
    classe: string
    doce: boolean
    ncm: string
    cfop: string
    csosn: string
    tamanhos: ITamanhoIA[]
    massas: IMassaIA[]
    bordas: IBordaIA[]
    sabores: ISaborIA[]
}

export interface ICardapioIA {
    tipoDetectado: string
    erro?: string
    classes: string[]
    gruposAdicionais: IGrupoAdicionalIA[]
    produtos: IProdutoCardapioIA[]
    pizzas: IPizzaCardapioIA[]
}

export interface ICriarCardapioResultado {
    total: number
    produtos: { id: number; cod: number; nome: string }[]
    pizzas?: { id: number; cod: number; nome: string; sabores: number }[]
    classes: number
    tributacoes: number
    materiasPrimas: number
    gruposAdicionais: number
}

export type TipoCardapio = 'AUTO' | 'LANCHE' | 'PIZZA'
