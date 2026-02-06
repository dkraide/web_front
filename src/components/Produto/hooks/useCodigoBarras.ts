import { toast } from 'react-toastify';
import { AxiosError, AxiosResponse } from 'axios';
import _ from 'lodash';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import ICodBarras from '@/interfaces/ICodBarras';
import { fGetNumber } from '@/utils/functions';

export function useCodigoBarras(produto: IProduto, setProduto: (produto: IProduto) => void) {
    const addCodigo = (codigoBarras: string) => {
        const codigo = fGetNumber(codigoBarras);
        
        if (!produto.codBarras) {
            produto.codBarras = [];
        }

        const ind = _.findIndex(produto.codBarras, (o) => o.codigo === codigo);
        
        if (ind >= 0) {
            toast.error('Codigo ja adicionado.');
            return false;
        }

        produto.codBarras.push({
            codigo: codigo,
            idProduto: produto.idProduto,
            produtoId: produto.id,
            empresaId: produto.empresaId,
        } as ICodBarras);

        setProduto({ ...produto, codBarras: produto.codBarras });
        return true;
    };

    const removeCodigo = async (index: number) => {
        if (produto.codBarras[index].id > 0) {
            const res = await api
                .delete(`/CodBarras/Delete?id=${produto.codBarras[index].id}`)
                .then((res: AxiosResponse) => {
                    toast.success('Codigo de barras excluido na nuvem');
                    return true;
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao excluir codigo na nuvem. ${err.message}`);
                    return false;
                });

            if (!res) return;
        }

        produto.codBarras.splice(index, 1);
        setProduto({ ...produto, codBarras: produto.codBarras });
    };

    return {
        addCodigo,
        removeCodigo,
    };
}