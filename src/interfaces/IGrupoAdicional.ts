import IMateriaPrima from "./IMateriaPrima"

export default interface IGrupoAdicional{
        idGrupoAdicional: number
        id: number
        descricao: string
        status: boolean
        minimo: number
        maximo: number
        empresaId: number
        lastChange: Date
        localCriacao: string
        produtosAdicionais: IGrupoAdicionalMateriaPrima[]
}

export interface IGrupoAdicionalMateriaPrima{
        idGrupoAdicionalMateriaPrima: number;
        id: number;
        nome: string;
        valor: number;
        status: boolean;
        idGrupoAdicional: number;
        grupoAdicionalId: number;
        grupoAdicional: IGrupoAdicional;
        materiaPrima: IMateriaPrima;
        materiaPrimaId: number;
        idMateriaPrima: number;
        empresaId: number;
        lastChange: Date;
        localCriacao: string;
}