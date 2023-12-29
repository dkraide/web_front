export default interface IPix{
     txid: string
     location: string
     status: string
     valor: IPixValor
     chave: string
     solicitacaoPagador: string
     revisao: number
     pixCopiaECola: string
}
export interface IPixValor{
    original: string
}