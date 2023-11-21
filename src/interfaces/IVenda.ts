import IUsuario from "./IUsuario"
import IVendaPagamento from "./IVendaPagamento"
import IVendaProduto from "./IVendaProduto"

export default interface IVenda{
         idVenda: number
         dataVenda: Date
         valorSubTotal: number
         valorTotal: number
         valorDesconto: number
         cpfCliente: string
         idUsuario: number
         caminhoCancelamento: string
         caminhoArquivo: string
         estd: boolean
         statusVenda: boolean
         idMovimentoCaixa: number
         motivoCancelamento: string
         logradouro: string
         numero: string
         complemento: string
         bairro: string
         municipio: string
         uF: string
         cep: string
         ibge: number
         nomeCliente: string
         idCliente: number
         valorAcrescimo: number
         observacao: string
         id: number
         attOnline: boolean
         nnf: number
         deliveryId: string
         movimentoCaixaId: number
         idUsuarioGorjeta: number
         idComanda: number
         pontosGanhos: number
         idUsuarioCancelamento: number
         empresa: string
         usuarioGorjetaId: number
         usuario: IUsuario
         usuarioId: number
         comandaId: number
         clienteId: number
         usuarioCancelamentoId: number
         timeStampVenda: number
         valorCusto: number
         dataCancelamento: Date
         pagamentos: IVendaPagamento[]
         produtos: IVendaProduto[]
}