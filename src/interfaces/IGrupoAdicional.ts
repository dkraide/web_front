import { IGrupoAdicionalItem } from "./IGrupoAdicionalItem"
import IProdutoGrupoAdicional from "./IProdutoGrupoAdicional"

export default interface IGrupoAdicional {
    keetaId: string;
    idGrupoAdicional: number;
    id: number;
    empresaId: number;
    tipo: 'PADRAO' | 'BORDA' | 'TAMANHO' | 'SABOR' | 'MASSA';
    // Regra de preço do grupo quando há mais de um item escolhido (pizza
    // meio-a-meio): SOMAR (soma os valores), MAIOR (cobra o mais caro) ou
    // MEDIA (soma ÷ qtd de porções). Ausente = SOMAR no backend.
    baseCalculo?: 'SOMAR' | 'MAIOR' | 'MEDIA';
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