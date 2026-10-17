import { TipoMidia } from './IProdutoMidia'

export interface ISetorMidia {
     url: string
     tipo: TipoMidia
}

// Produto como a vitrine do setor enxerga (publico e previa do admin).
export interface ISetorProdutoView {
     produtoId: number
     nome: string
     descricao?: string | null
     valor: number
     midias?: ISetorMidia[] | null
}

export interface ISetorLoja {
     nome: string
     descricao?: string | null
     logoUrl?: string | null
     bannerUrl?: string | null
     endereco?: string | null
     telefone?: string | null
     whatsapp?: string | null
     instagram?: string | null
}

export interface ISetorPublico {
     nome: string
     descricao?: string | null
     loja: ISetorLoja
     produtos: ISetorProdutoView[]
}
