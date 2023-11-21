export default interface IMateriaPrima{
     id: number
     idMateriaPrima: number
     nome: string
     valorCusto: number
     valorVenda: number
     custoTotal: number
     quantidade: number
     lastChange: Date
     localCriacao: string
     status: boolean
     empresaId: number
     localPath: string
}