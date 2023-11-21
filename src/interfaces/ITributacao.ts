export default interface ITributacao{
     cfop: string
     ncm: string
     descricao: string
     id: number
     empresaId: number
     cest: string
     lastChange: Date
     idTributacao: number
     localCriacao: string
     cstPis: number
     cstCofins: number
     cstIcms: number
     cstOrigem: number
     pPis: number
     pCofins: number
     pIcms: number
     pisVAliq: number
     cofinsVAliq: number
     status: boolean
     federal: number
     estadual: number
     municipal: number
}