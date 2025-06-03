import IClasseMaterial from "./IClasseMaterial";
import IProduto from "./IProduto";

export default interface IPremio {
  idPremio: number;
  idProduto: number;
  idClasseMaterial: number;
  produto: IProduto; // Supondo que exista uma interface IProduto
  classeMaterial: IClasseMaterial; // Supondo que exista uma interface IClasseMaterial
  descricao: string;
  quantidadePontos: number;
  status: boolean;
  empresaId: number;
  id: number;
  

  needChange: boolean;
  lastChange: string; // ISO date string (padrão em APIs REST)
  produtoId: number;
  classeMaterialId: number
}