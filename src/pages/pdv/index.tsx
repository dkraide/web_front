import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';

export default function Pdv(){

    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)


    const produtos = [];
    const promocoes = [];
    const combos = [];

    useEffect(() => {
       loadData();
    });
    async function loadData(){
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api.get(`/Produto/List?empresaId=${user?.id || u.id}&status=true`)
    }

    return(
        <div className={styles.container}>

        </div>
    )
}