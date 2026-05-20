import IProduto from "@/interfaces/IProduto";
import { api } from "./apiClient";

export const produtoService = {
    async getAll(empresaId: number, statusProduto?: boolean | undefined ) {
        let url = '/v2/produto?empresaId=' + empresaId;
        if (statusProduto != undefined) url += '&status=' + statusProduto;
        const { data } = await api.get<IProduto[]>(
            url
        );
        return data;
    }

}