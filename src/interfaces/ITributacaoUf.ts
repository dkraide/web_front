export default interface ITributacaoUf {
    id: number
    idTributacaoUf: number
    empresaId: number
    uf: string
    tributacaoId: number
    idTributacao: number
    cfop?: string
    cBenef?: string
    cstPis: number
    pPis: number
    pisVAliq: number
    cstCofins: number
    pCofins: number
    cofinsVAliq: number
    cstIcms: number
    pIcms: number
    localCriacao?: string
    lastChange?: Date
}
