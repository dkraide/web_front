import { ISetorMidia, ISetorProdutoView } from '@/interfaces/ISetorPublico'

/** Slides do produto: somente a galeria de midias, na ordem (a foto principal do produto nao entra). */
export function slidesDoProduto(p: ISetorProdutoView): ISetorMidia[] {
    return (p.midias ?? []).filter(m => !!m.url)
}

/** Primeira midia visual (preferindo imagem/gif) para capas e miniaturas. */
export function capaDoProduto(p: ISetorProdutoView): ISetorMidia | undefined {
    const slides = slidesDoProduto(p)
    return slides.find(s => s.tipo !== 'VIDEO') ?? slides[0]
}

export const brl = (v: number) =>
    (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
