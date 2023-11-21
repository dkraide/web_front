import IMovimentoCaixa from "./IMovimentoCaixa"

export default interface ISangriaReforco{
      id:  number
      idSangriaReforco: number
      idMovimentoCaixa: number
      movimentoCaixaId: number
      dataSangria: Date
      valorMovimento: number
      isSangria: boolean
      movimentoCaixa: IMovimentoCaixa
      nomeUsuario: string
      motivo: string
      empresaId: number
}