// Finalidade do produto (SPED TIPO_ITEM). A API serializa o enum como numero; aceita nome tambem.
export const FINALIDADES: { value: string; label: string; codigo: number }[] = [
    { value: 'REVENDA', label: 'Revenda', codigo: 0 },
    { value: 'MATERIA_PRIMA', label: 'Matéria-prima', codigo: 1 },
    { value: 'EMBALAGEM', label: 'Embalagem', codigo: 2 },
    { value: 'PRODUTO_EM_PROCESSO', label: 'Produto em processo', codigo: 3 },
    { value: 'PRODUTO_ACABADO', label: 'Produto acabado', codigo: 4 },
    { value: 'SUBPRODUTO', label: 'Subproduto', codigo: 5 },
    { value: 'PRODUTO_INTERMEDIARIO', label: 'Produto intermediário', codigo: 6 },
    { value: 'MATERIAL_USO_CONSUMO', label: 'Material de uso e consumo', codigo: 7 },
    { value: 'ATIVO_IMOBILIZADO', label: 'Ativo imobilizado', codigo: 8 },
    { value: 'SERVICOS', label: 'Serviços', codigo: 9 },
    { value: 'OUTROS_INSUMOS', label: 'Outros insumos', codigo: 10 },
    { value: 'OUTRAS', label: 'Outras', codigo: 99 },
];

/** Normaliza o valor vindo da API (numero ou nome) para o nome do enum. */
export function finalidadeKey(v: unknown): string {
    if (typeof v === 'number') return FINALIDADES.find(f => f.codigo === v)?.value ?? 'REVENDA';
    if (typeof v === 'string' && v) return FINALIDADES.some(f => f.value === v) ? v : 'REVENDA';
    return 'REVENDA';
}

export function finalidadeLabel(v: unknown): string {
    const k = finalidadeKey(v);
    return FINALIDADES.find(f => f.value === k)?.label ?? k;
}

/** Finalidades que o sistema usa de fato: as unicas oferecidas nos filtros. */
export const FINALIDADES_VISIVEIS = FINALIDADES.filter(f => f.value === 'REVENDA' || f.value === 'MATERIA_PRIMA');
