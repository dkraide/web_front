import { toast } from "react-toastify";
import { api } from "./apiClient";

export const vendaService = {
    async listVendas(empresaId: number, dataIn: string, dataFim: string, specific: boolean){
         return await api.get('/venda/list?empresaId=' + empresaId + '&dataIn=' + dataIn + '&dataFim=' + dataFim + '&specific=' + specific)
         .then(({data}) => {
            return data;
         }).catch((err) => {
             toast.error('Erro ao listar vendas: ' + err.message);
             return null;
         });

    },
}