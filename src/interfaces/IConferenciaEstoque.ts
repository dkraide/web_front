import IProduto from "./IProduto"
import IUsuario from "./IUsuario"

export default interface IConferenciaEstoque {
    idConferenciaEstoque: number
    id: number
    produto: IProduto
    idProduto: number
    produtoId: number
    quantidadeInformada: number
    quantidadeReal: number
    dataConferencia: Date
    usuarioConferencia: IUsuario
    idUsuario: number
    usuarioId: number
    usuarioNome: string
    empresaId: number
}