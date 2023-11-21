import IEmpresa from "./IEmpresa"

export default interface IDuplicata{
 id: number
 empresaId: number
 empresa: IEmpresa
 dataEmissao: Date
 dataVencimento: Date
 dataPagamento: Date
 valor: number
 nossoNumero: string
 codBarras: string
 isCancelado: boolean
 isPago : boolean
 formaPagamento: string
 chaveNFSE: string
 loteNFSE: number
 protocolo: string
 numeroRPS: string
 numeroNFSE: string
 serieNFSE: string
}