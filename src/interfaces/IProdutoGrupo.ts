import IProduto from "./IProduto";
import { IProdutoGrupoItem } from "./IProdutoGrupoItem";



export default interface IProdutoGrupo{
    idProdutoGrupo: number;
    id: number;
    idProduto: number;
    produtoId: number;
    empresaId: number;
    produto: IProduto;
    tipo: 'PADRAO' | 'BORDA' | 'TAMANHO' | 'SABOR' | 'MASSA';
    descricao: string;
    status: boolean;
    minimo: number;
    maximo: number;
    itens: IProdutoGrupoItem[];
}