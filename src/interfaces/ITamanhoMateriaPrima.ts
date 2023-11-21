import IMateriaPrima from "./IMateriaPrima"
import ITamanho from "./ITamanho"

export default interface ITamanhoMateriaPrima {
    idTamanhoMateriaPrima: number
    idMateriaPrima: number
    idTamanho: number
    id: number
    quantidadeMateriaPrima: number
    opcional: boolean
    lastChange: Date
    localCriacao: string
    tamanho: ITamanho
    materiaPrima: IMateriaPrima
    materiaPrimaId: number
    tamanhoId: number
    empresaId: number
}