import { api } from "@/services/apiClient";

export interface DownloadItem {
    slug: string;
    nome: string;
    descricao: string | null;
    categoria: string | null;
    plataforma: string | null;
    versao: string;
    tamanhoBytes: number;
    publicadoEm: string;
    /** Caminho relativo à origem da API (ex.: /api/v2/downloads/slug/arquivo?versao=1.0.0). */
    url: string;
}

export interface DownloadDetalhe {
    versao: string;
    notas: string | null;
    sha256: string | null;
    publicadoEm: string;
}

/** O backend devolve a URL sem host; o link precisa apontar para a API, não para o site. */
export function urlAbsoluta(caminho: string): string {
    const base = api.defaults.baseURL ?? "";
    try {
        return new URL(caminho, base).toString();
    } catch {
        return caminho;
    }
}

export async function listarDownloads(): Promise<DownloadItem[]> {
    const { data } = await api.get<DownloadItem[]>("/v2/downloads");
    return data;
}

export async function detalheDownload(slug: string): Promise<DownloadDetalhe> {
    const { data } = await api.get<DownloadDetalhe>(`/v2/downloads/${slug}/latest`);
    return data;
}
