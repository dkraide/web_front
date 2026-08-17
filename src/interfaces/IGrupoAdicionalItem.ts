import IMateriaPrima from "./IMateriaPrima";
import IGrupoAdicional from "./IGrupoAdicional";

export interface IGrupoAdicionalItem {
  id: string;
  idGrupoAdicionalItem: string;
  idGrupoAdicional: number;
  grupoAdicionalId: number;
  grupoAdicional?: IGrupoAdicional;
  materiaPrima: IMateriaPrima;
  idMateriaPrima: number;
  materiaPrimaId: number;
  nome: string;
  descricao: string;
  valor: number;
  qtdSabores: number;
  status: boolean;
  precos: IGrupoAdicionalItemPreco[];
  empresaId: number;
  lastChange: Date;
  needChange: boolean;
  localPath?: string;
  temporaryImage?: any;
}

export interface IGrupoAdicionalItemPreco {
    id: string;
    idGrupoAdicionalItemPreco: string;
    idGrupoAdicionalItem: string;
    grupoAdicionalItemId: string;
    idGrupoAdicionalItemRelacao: string;
    grupoAdicionalItemRelacaoId: string;
    // valor "inteiro" (pizza inteira); valorFracionado = aplicado a um sabor só.
    // Só o COMPLEMENTO usa o fracionado; nos demais fica 0/ausente.
    valor: number;
    valorFracionado?: number;
    lastChange: Date;
    needChange: boolean;
    empresaId: number;
}