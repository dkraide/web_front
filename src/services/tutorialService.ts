// Leitura PÚBLICA dos tutoriais (sem login). fetch direto, sem os interceptors do axios de usuário logado.
export interface TutorialResumo {
    id: number;
    sistema: string;
    modulo: string;
    titulo: string;
    slug: string;
    resumo: string | null;
    temVideo: boolean;
}

export interface Tutorial {
    id: number;
    sistema: string;
    modulo: string;
    titulo: string;
    slug: string;
    resumo: string | null;
    corpo: string | null;
    urlVideo: string | null;
    updatedAt: string | null;
}

const base = () =>
    process.env.NODE_ENV === 'development' ? 'http://localhost:7020/api' : 'https://pdv.krdsys.tech/api';

async function get<T>(caminho: string): Promise<T> {
    const res = await fetch(`${base()}${caminho}`);
    if (!res.ok) throw new Error(res.status === 404 ? 'Tutorial não encontrado.' : 'Não foi possível carregar os tutoriais.');
    return res.json();
}

export const listarTutoriais = () => get<TutorialResumo[]>('/Tutorial');
export const obterTutorial = (slug: string) => get<Tutorial>(`/Tutorial/${encodeURIComponent(slug)}`);

export const SISTEMA_LABEL: Record<string, string> = {
    PDV: 'PDV',
    WEB: 'Sistema Web',
    DELIVERY: 'Delivery',
    SELF: 'Autoatendimento',
    GARCOM: 'Garçom',
    OFICINA: 'Oficina',
};
export const nomeSistema = (s: string) => SISTEMA_LABEL[s] ?? s;

/** Aceita youtu.be/ID, watch?v=ID, embed/ID e shorts/ID; devolve a URL do player sem cookies. */
export function urlEmbedYoutube(url: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

/** Remove acentos e caixa para a busca ignorar "Nota de Entrada" vs "nota de entrada". */
export const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
