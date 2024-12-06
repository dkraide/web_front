import IMateriaPrima from "./IMateriaPrima";
import IProdutoGrupo from "./IProdutoGrupo";

export interface IProdutoGrupoItem {
  id: string;
  idProdutoGrupoItem: string;
  idProdutoGrupo: number;
  produtoGrupoId: string;
  produtoGrupo: IProdutoGrupo;
  materiaPrima: IMateriaPrima;
  idMateriaPrima: number;
  materiaPrimaId: number;
  nome: string;
  descricao: string;
  valor: number;
  qtdSabores: number;
  status: boolean;
  precos: IProdutoGrupoItemPreco[];
}
export interface IProdutoGrupoItemPreco {
    id: string;
    idProdutoGrupoItemPreco: string;
    idProdutoGrupoItem: string;
    produtoGrupoItemId: string;
    idProdutogrupoitemrelacao: string;
    produtogrupoitemrelacaoId: string;
    valor: number;
  }