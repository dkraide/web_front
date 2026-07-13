import { toast } from 'react-toastify';
import IProduto from '@/interfaces/IProduto';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';

export function useGrupoAdicionais(
    produto: IProduto,
    setProduto: (produto: IProduto) => void,
) {
    const addOrUpdateGrupo = (vinculo: IProdutoGrupoAdicional, index: number) => {
        if (!produto.grupoAdicionais) {
            produto.grupoAdicionais = [];
        }

        if (index < 0) {
            // Adicionar novo vínculo
            produto.grupoAdicionais.push(vinculo);
        } else {
            // Atualizar vínculo existente
            produto.grupoAdicionais[index] = vinculo;
        }

        setProduto({ ...produto });
    };

    const removeGrupo = (index: number) => {
        if (!produto.grupoAdicionais || index < 0 || index >= produto.grupoAdicionais.length) {
            toast.error('Grupo não encontrado.');
            return;
        }

        // A remoção do vínculo é feita localmente aqui. O backend (ProdutoService)
        // já identifica e remove os vínculos que não vierem mais na lista quando
        // o produto for salvo (PUT /v2/Produto).
        const newGrupos = produto.grupoAdicionais.filter((_, i) => i !== index);
        setProduto({ ...produto, grupoAdicionais: newGrupos });
    };

    return {
        addOrUpdateGrupo,
        removeGrupo,
    };
}