import ILancamentoEstoqueProduto from "./ILancamentoEstoqueProduto"

export default interface ILancamentoEstoque{
 idLancamentoEstoque: number
 id: number
 dataLancamento: Date
 idPedido: number
 arquivoXML: string
 comentario: string
 isEntrada: boolean
 isProduto: boolean
 nomeArquivo: string
 produtos: ILancamentoEstoqueProduto[]
 empresaId: number
}