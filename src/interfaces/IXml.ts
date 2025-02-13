import IVenda from "./IVenda"

export default interface IXml{
     id: number
     idnfcecfeXml: number
     idVenda: number
     xmlVenda: string
     xmlCancelamento: string
     retornoMotivo: string
     retornoNro: number
     venda: IVenda
     isSat: boolean
     idLoteEnvioXML: number
     empresaId: number
     vendaId: number
     dataEmissao: Date
     vnf: number
     nnf: string
}