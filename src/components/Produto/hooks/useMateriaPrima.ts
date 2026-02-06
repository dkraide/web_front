import { toast } from 'react-toastify';
import { AxiosError, AxiosResponse } from 'axios';
import _ from 'lodash';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import IMateriaPrima from '@/interfaces/IMateriaPrima';
import IProdutoMateriaPrima from '@/interfaces/IProdutoMateriaPrima';
import IUsuario from '@/interfaces/IUsuario';

export function useMateriaPrima(
    produto: IProduto,
    setProduto: (produto: IProduto) => void,
    user: IUsuario
) {
    const addMp = (mp: IMateriaPrima, qntd: number, opc: boolean) => {
        if (!produto.materiaPrimas) {
            produto.materiaPrimas = [];
        }

        const index = _.findIndex(
            produto.materiaPrimas,
            (o: IProdutoMateriaPrima) => o.materiaPrimaId === mp.id
        );

        if (index >= 0) {
            toast.error('Materia prima ja vinculada ao produto.');
            return;
        }

        produto.materiaPrimas.push({
            idProdutoMateriaPrima: 0,
            idProduto: produto.idProduto,
            idMateriaPrima: mp.idMateriaPrima,
            id: 0,
            quantidadeMateriaPrima: qntd,
            opcional: opc,
            lastChange: new Date(),
            localCriacao: 'ONLINE',
            materiaPrima: mp,
            produtoId: produto.id,
            materiaPrimaId: mp.id,
            empresaId: user.empresaSelecionada,
        } as IProdutoMateriaPrima);

        setProduto({ ...produto, materiaPrimas: produto.materiaPrimas });
    };

    const removeMateriaPrima = async (materiaPrimaId: number) => {
        const index = _.findIndex(
            produto.materiaPrimas,
            (o: IProdutoMateriaPrima) => o.materiaPrimaId === materiaPrimaId
        );

        if (index < 0) {
            toast.error('Materia prima não encontrada.');
            return;
        }

        const id = produto.materiaPrimas[index].id;

        if (id > 0) {
            const res = await api
                .delete(`/ProdutoMateriaPrima/Delete?id=${id}`)
                .then((res: AxiosResponse) => {
                    toast.success('Materia prima excluida na nuvem');
                    return true;
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao excluir materia prima. ${err.message}`);
                    return false;
                });

            if (!res) return;
        }

        const newMateriaPrimas = produto.materiaPrimas.filter((_, i) => i !== index);
        setProduto({ ...produto, materiaPrimas: newMateriaPrimas });
    };

    return {
        addMp,
        removeMateriaPrima,
    };
}