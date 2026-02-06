import { toast } from 'react-toastify';
import { AxiosError, AxiosResponse } from 'axios';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';

export function useGrupoAdicionais(
    produto: IProduto,
    setProduto: (produto: IProduto) => void
) {
    const addOrUpdateGrupo = (grupo: IProdutoGrupo, index: number) => {
        if (!produto.grupoAdicionais) {
            produto.grupoAdicionais = [];
        }

        if (index < 0) {
            // Adicionar novo
            produto.grupoAdicionais.push(grupo);
        } else {
            // Atualizar existente
            produto.grupoAdicionais[index] = grupo;
        }

        setProduto({ ...produto });
    };

    const removeGrupo = async (index: number) => {
        if (!produto.grupoAdicionais || index < 0 || index >= produto.grupoAdicionais.length) {
            toast.error('Grupo não encontrado.');
            return;
        }

        const grupo = produto.grupoAdicionais[index];

        // // Se o grupo já está salvo na nuvem, deleta lá também
        // if (grupo.id && grupo.id > 0) {
        //     const res = await api
        //         .delete(`/ProdutoGrupo/Delete?id=${grupo.id}`)
        //         .then((res: AxiosResponse) => {
        //             toast.success('Grupo excluído na nuvem');
        //             return true;
        //         })
        //         .catch((err: AxiosError) => {
        //             toast.error(`Erro ao excluir grupo. ${err.message}`);
        //             return false;
        //         });

        //     if (!res) return;
        // }

        // Remove do array local
        const newGrupos = produto.grupoAdicionais.filter((_, i) => i !== index);
        setProduto({ ...produto, grupoAdicionais: newGrupos });
    };

    return {
        addOrUpdateGrupo,
        removeGrupo,
    };
}