export default interface IFormaPagamento{
      idFormaPagamento: number
      id: number
      nome: string
      geraFaturamento: boolean
      isVisivel: boolean
      identificacaoSAT: string
      botaoAtiva: string
      valorJuros: number
      empresaId: number
      localCriacao: string
      lastChange: Date
}