import ISangriaReforco from "./ISangriaReforco"
import IUsuario from "./IUsuario"
import IVenda from "./IVenda"

export default interface IMovimentoCaixa{
 idMovimentoCaixa: number
 id: number
 idUsuario: number
 usuarioId: number
 dataMovimento: Date
 dataFechamento: Date
 status: boolean
 valorDinheiro: number
 valorDinheiroFinal: number
 computadorID: string
 usuario: IUsuario
 empresaId: number
 sangrias: ISangriaReforco[]
 vendas: IVenda[]
 attOnline: boolean
}