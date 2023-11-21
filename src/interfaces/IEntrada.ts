import IMotivoLancamento from "./IMotivoLancamento"

export default interface IEntrada{
     idEntrada: number
     lastChange: Date
     dataLancamento: Date
     dataRecebimento: Date
     descricao: string
     idMotivoLancamento: number
     motivoLancamento: IMotivoLancamento
     valorTotal: number
     statusRecebimento: boolean
     id: number
     localCriacao: string
     motivoLancamentoId: number
     isChanged: boolean
     empresaId: number
}