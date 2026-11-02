import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';
import IUsuario from '@/interfaces/IUsuario';
import { useUsuario } from './useUsuario';

type Params = Record<string, string | number | undefined>;

/**
 * Carrega `GET {path}?empresaId=<empresa selecionada>&...params` e mantém lista/loading.
 * `params` (filtros de data/status) é lido no momento do `reload()`; mudar um filtro não busca
 * sozinho, quem decide é o botão "Pesquisar" da tela.
 * Sem sessão não chama a API (e não trava em loading).
 */
export function useListaCrud<T>(path: string, params?: Params) {
    const paramsRef = useRef(params);
    paramsRef.current = params;
    const { user, pronto } = useUsuario();
    const [list, setList] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({ empresaId: String(user.empresaSelecionada) });
            Object.entries(paramsRef.current || {}).forEach(([k, v]) => {
                if (v !== undefined) query.set(k, String(v));
            });
            const { data } = await api.get<T[]>(`${path}?${query}`);
            setList(data);
        } catch (e) {
            const err = e as AxiosError;
            toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [path, user]);

    useEffect(() => {
        if (pronto && !user) setLoading(false);
        reload();
    }, [pronto, reload]);

    return { list, loading, reload, user: user as IUsuario | undefined };
}
