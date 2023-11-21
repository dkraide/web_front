export default interface IMenuDigitalConfiguracao{
    id: number
    empresaId: number
    todoDia: boolean
    horario: string
    corFundo: string
    latitude: number
    longitude: number
    isValorFixo: boolean
    valorPorKm: number
    valorInicial: number
    limiteKm: number
    entrega: boolean
    horarios: IMenuDigitalHorario[]
}

interface IMenuDigitalHorario{
    dia: string
    abertura: string
    fechamento: string
}