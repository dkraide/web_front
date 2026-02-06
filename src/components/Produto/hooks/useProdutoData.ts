import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { AxiosResponse } from 'axios';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';

export function useProdutoData() {
    const [produto, setProduto] = useState<IProduto>({} as IProduto);
    const [user, setUser] = useState<IUsuario>();
    const [loading, setLoading] = useState(true);
    const { getUser } = useContext(AuthContext);
    const router = useRouter();
    const { id } = router.query;

    const loadUser = async () => {
        if (!user) {
            const res = await getUser();
            setUser(res);
            return res;
        }
        return user;
    };

    const loadCod = async () => {
        const u = await loadUser();
        const cod = await api
            .get(`/Produto/NextCod?empresaId=${u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse<number>) => data)
            .catch((err) => {
                toast.error(`Erro ao buscar codigo. ${err.message}`);
                return 0;
            });
        return cod;
    };

    useEffect(() => {
        if (!router.isReady) return;

        loadUser();

        if (!id) {
            loadCod();
        } else {
            api.get(`/Produto/Select?id=${id}`).then(({ data }) => {
                console.log('produto carregado', data);
                setProduto(data);
            });
        }
        setLoading(false);
    }, [router.isReady]);

    return {
        produto,
        setProduto,
        user,
        loading,
        setLoading,
        loadCod,
    };
}