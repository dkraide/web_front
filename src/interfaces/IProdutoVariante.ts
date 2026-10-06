// Variante (cor x tamanho) de um produto de ROUPA, com o estoque do par.
export default interface IProdutoVariante {
    id: number;
    produtoId: number;
    corItemId: string;
    corNome: string;
    corHex: string;
    tamanhoItemId: string;
    tamanhoNome: string;
    valor: number;
    materiaPrimaId: number;
    sku: string | null;
    codBarras: string | null;
    ativo: boolean;
    estoque: number;
}
