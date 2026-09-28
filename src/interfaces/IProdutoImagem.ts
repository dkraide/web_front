export default interface IProdutoImagem {
     id: number
     idProdutoImagem: number
     idProduto: number
     produtoId: number
     empresaId: number
     // URL da imagem hospedada (krdpic) e ordem dentro da galeria do produto.
     localPath: string
     posicao: number
     imagemString: string
     isEnviado: boolean
     localOnline: string
}
