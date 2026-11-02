import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';

/** Usuário logado, lido do cookie de sessão. `undefined` até carregar (ou sem sessão). */
export function useUsuario() {
    const { getUser } = useContext(AuthContext);
    const [user, setUser] = useState<IUsuario>();
    const [pronto, setPronto] = useState(false);

    useEffect(() => {
        getUser()
            .then(setUser)
            .finally(() => setPronto(true));
    }, []);

    return { user, pronto };
}
