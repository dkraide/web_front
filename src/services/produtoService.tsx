import IProduto from "@/interfaces/IProduto";
import { ICardapioIA, ICriarCardapioResultado, TipoCardapio } from "@/interfaces/ICardapioIA";
import { api } from "./apiClient";

export const produtoService = {
    async getAll(empresaId: number, statusProduto?: boolean | undefined ) {
        let url = '/v2/produto?empresaId=' + empresaId;
        if (statusProduto != undefined) url += '&status=' + statusProduto;
        const { data } = await api.get<IProduto[]>(
            url
        );
        return data;
    },

    // Le N fotos de cardapio e retorna o rascunho estruturado (nao persiste nada).
    async lerCardapio(empresaId: number, files: File[], tipo: TipoCardapio = 'AUTO') {
        const form = new FormData();
        files.forEach((f) => form.append('files', f, f.name));
        form.append('tipo', tipo);
        const { data } = await api.post<ICardapioIA>(
            `/v2/Produto/${empresaId}/ler-cardapio`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data;
    },

    // Persiste em massa o cardapio revisado pelo usuario.
    async criarCardapio(empresaId: number, cardapio: ICardapioIA) {
        const { data } = await api.post<ICriarCardapioResultado>(
            `/v2/Produto/${empresaId}/criar-cardapio`,
            cardapio
        );
        return data;
    }
}
