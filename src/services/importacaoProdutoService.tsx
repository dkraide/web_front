import { api } from "./apiClient";

export interface IImportacaoCampo { chave: string; titulo: string; obrigatorio: boolean }
export interface IImportacaoColuna { indice: number; nome: string; amostra: string[] }
export interface IImportacaoAnalise {
    colunas: IImportacaoColuna[]
    linhas: string[][]
    campos: IImportacaoCampo[]
    sugestao: Record<string, number>
}
export interface IImportacaoPadroes {
    status: boolean
    visivelMenu: boolean
    valorCompra: number
    quantidade: number
    unidadeCompra: string
    classeMaterialId: number
    tributacaoId: number
    cfop: string
}
export interface IImportacaoItem {
    linha: number
    cod: number
    nome: string
    descricao?: string
    classeNome?: string
    classeMaterialId: number
    ncm?: string
    tributacaoId: number
    cfop?: string
    valor: number
    valorCompra: number
    quantidade: number
    quantidadeMinima: number
    status: boolean
    visivelMenu: boolean
    unidadeCompra?: string
    codBarras?: string
    ignorar: boolean
    jaExiste: boolean
    avisos: string[]
}
export interface IImportacaoOpcao { id: number; nome: string }
export interface IImportacaoPreview { itens: IImportacaoItem[]; classes: IImportacaoOpcao[]; tributacoes: IImportacaoOpcao[] }
export interface IImportacaoResultado {
    produtosCriados: number
    classesCriadas: number
    tributacoesCriadas: number
    erros: { linha: number; nome: string; mensagem: string }[]
}

export const importacaoProdutoService = {
    async analisar(empresaId: number, file: File) {
        const form = new FormData()
        form.append('file', file, file.name)
        const { data } = await api.post<IImportacaoAnalise>(`/v2/ImportacaoProduto/${empresaId}/analisar`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },
    async preview(empresaId: number, linhas: string[][], mapeamento: Record<string, number>, padroes: IImportacaoPadroes) {
        const { data } = await api.post<IImportacaoPreview>(`/v2/ImportacaoProduto/${empresaId}/preview`, { linhas, mapeamento, padroes })
        return data
    },
    async confirmar(empresaId: number, itens: IImportacaoItem[]) {
        const { data } = await api.post<IImportacaoResultado>(`/v2/ImportacaoProduto/${empresaId}/confirmar`, itens)
        return data
    },
}
