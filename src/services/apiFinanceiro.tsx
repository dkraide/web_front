import { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { api } from "./apiClient";

export interface PagamentoPixResultDto {
    id: number;
    pixCopiaECola: string;
    valorTotal: number;
    vencimento: string;
}

export interface PagamentoPixAtivoDto {
    id: number;
    txId: string;
    valorTotal: number;
    vencimento: string;
    dataCriacao: string;
    pixCopiaECola: string;
    observacao: string;
    duplicataIds: number[];
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

export const apiFinanceiro = {
    getUltimasDuplicatas: async (meses: number = 10) => {
        return await api.get(`/Financeiro/GetUltimasDuplicatas?meses=${meses}`)
            .then(({ data }: AxiosResponse) => data)
            .catch((err: AxiosError) => {
                toast.error(`Erro ao buscar duplicatas. ${err.response?.data || err.message}`);
                return [];
            });
    },

    gerarPix: async (duplicataIds: number[]): Promise<PagamentoPixResultDto | null> => {
        return await api.post(`/Financeiro/GerarPix`, { duplicataIds })
            .then(({ data }: AxiosResponse<PagamentoPixResultDto>) => data)
            .catch((err: AxiosError) => {
                toast.error(`Erro ao gerar PIX. ${err.response?.data || err.message}`);
                return null;
            });
    },

    getPagamentosPixAtivos: async (): Promise<PagamentoPixAtivoDto[]> => {
        return await api.get(`/Financeiro/PagamentosPixAtivos`)
            .then(({ data }: AxiosResponse<PagamentoPixAtivoDto[]>) => data)
            .catch((err: AxiosError) => {
                toast.error(`Erro ao buscar PIX ativos. ${err.response?.data || err.message}`);
                return [];
            });
    },

    downloadBoleto: async (duplicataId: number, nossoNumero: string): Promise<boolean> => {
        return await api.get(`/Boleto/Impressao?Id=${duplicataId}`, { responseType: 'blob' })
            .then(({ data }: AxiosResponse<Blob>) => {
                downloadBlob(data, `boleto_${nossoNumero || duplicataId}.pdf`);
                return true;
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao baixar boleto. ${err.response?.data || err.message}`);
                return false;
            });
    },

    downloadNFSe: async (duplicataId: number, numeroNFSE: string): Promise<boolean> => {
        return await api.get(`/NFSe/${duplicataId}/Impressao`, { responseType: 'blob' })
            .then(({ data }: AxiosResponse<Blob>) => {
                downloadBlob(data, `nfse_${numeroNFSE || duplicataId}.pdf`);
                return true;
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao baixar NFS-e. ${err.response?.data || err.message}`);
                return false;
            });
    }
}