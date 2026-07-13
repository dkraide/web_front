import { IGrupoAdicionalItem } from "./IGrupoAdicionalItem"
import IProdutoGrupoAdicional from "./IProdutoGrupoAdicional"

export default interface IGrupoAdicional {
    keetaId: string;
    idGrupoAdicional: number;
    id: number;
    empresaId: number;
    tipo: 'PADRAO' | 'BORDA' | 'TAMANHO' | 'SABOR' | 'MASSA';
    descricao: string;
    status: boolean;
    minimo: number;
    maximo: number;
    itens: IGrupoAdicionalItem[];
    lastChange: Date;
    needChange: boolean;
    // navegação reversa: quais produtos usam esse grupo adicional
    produtos?: IProdutoGrupoAdicional[];
}