export type TipoMidia = 'IMAGEM' | 'GIF' | 'VIDEO'

export default interface IProdutoMidia {
     id: number
     idProdutoMidia: number
     idProduto: number
     produtoId: number
     empresaId: number
     // URL da midia hospedada (krdpic) e ordem dentro da galeria do produto.
     localPath: string
     posicao: number
     tipo: TipoMidia
}
