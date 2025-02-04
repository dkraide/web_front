import IEmpresa from "./IEmpresa"
import IMotivoLancamento from "./IMotivoLancamento"

export default interface IDespesa{
     idDespesa: number
     id: number
     localCriacao: string
     lastChange: Date
     dataLancamento: Date
     dataVencimento: Date
     dataPagamento: Date
     statusLancamento: boolean
     descricao: string
     pedidoReferencia: string
     valorSubTotal: number
     desconto: number
     acrescimo: number
     valorTotal: number
     idMotivoLancamento: number
     motivoLancamento: IMotivoLancamento
     isChanged: boolean
     motivoLancamentoId: number
     empresaId: number
     empresa: IEmpresa
     tipoDespesa?: string
     dataCompetencia: Date
}