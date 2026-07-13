import IProduto from "./IProduto";
import IGrupoAdicional from "./IGrupoAdicional";

export default interface IProdutoGrupoAdicional {
    id: number;                    // nuvem (PK, auto increment)
    idProdutoGrupoAdicional: number; // local (id gerado no PDV)
    idProduto: number;             // local -> Produto.IDProduto
    produtoId?: number;            // nuvem -> Produto.Id
    idGrupoAdicional: number;      // local -> GrupoAdicional.IDGrupoAdicional
    grupoAdicionalId?: number;     // nuvem -> GrupoAdicional.Id
    empresaId: number;
    lastChange: Date;
    needChange: boolean;

    produto?: IProduto;
    grupoAdicional?: IGrupoAdicional;
}