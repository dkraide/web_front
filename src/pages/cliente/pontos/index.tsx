import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import ICliente from '@/interfaces/ICliente';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { IPremioretirado } from '@/interfaces/IPremioRetirado';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';
import PontosGerados from '@/components/Cliente/Pontos/PontosGerados';
import PontosDisponiveis from '@/components/Cliente/Pontos/PontosDisponiveis';
import PontosUtilizados from '@/components/Cliente/Pontos/PontosUtilizados';

type props = {
    ini: string
    end: string
}

export default function ClientePontos() {
    const { getUser } = useContext(AuthContext);
    const [selected, setSelected] = useState<'entrada' | 'ativo' | 'saida'>('entrada');
    const [clientes, setClientes] = useState<ICliente[]>([]);
    const [premiosRetirados, setPremiosRetirados] = useState<IPremioretirado[]>([]);
    const [pontosGerados, setPontosGerados] = useState<IVenda[]>([])
    const [search, setSearch] = useState<props>({
        ini: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });

    const loadClientes = async () => {
        const user = await getUser();
        await api.get(`/v2/Cliente/list?empresaid=${user.empresaSelecionada}`)
            .then(({ data }: AxiosResponse<ICliente[]>) => {
                if (data && data.length > 0) {
                    const filtered = data.filter(p => p.pontos > 0);
                    setClientes(filtered);
                }
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar clientes`);
            });

    }
    const loadData = async () => {
        const user = await getUser();
        await api.get(`/PremioRetirado/list?empresaid=${user.empresaSelecionada}&dataIn=${search.ini}&dataFim=${search.end}`)
            .then(({ data }) => {
                setPremiosRetirados(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar premios retirados`);
            });
        await api.get(`/Venda/PontosGerados?empresaid=${user.empresaSelecionada}&dataIn=${search.ini}&dataFim=${search.end}`)
            .then(({ data }) => {
                setPontosGerados(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar pontos gerados`);
            });
    }
    useEffect(() => {
          loadClientes();
           loadData();
    }, []);

    const handleClickSearch = () => {
        loadData();
    }

    const totalEntrada = () => {
        var total = _.sumBy(pontosGerados, p => p.pontosGanhos ?? 0);
        return total;
    }
    const totalSaida = () => {
        var total = _.sumBy(premiosRetirados, p => p.pontos ?? 0);
        return total;
    }
    const totalAtivo = () => {
        var total = _.sumBy(clientes, p => p.pontos ?? 0);
        return total;
    }

    return (
        <div className={styles.container}>
            <div className={styles.resumo}>
                <div onClick={() => { setSelected('entrada') }} className={[styles.totalEntrada, selected == 'entrada' ? styles.selected : ''].join(' ')}>
                    <span>{totalEntrada()}</span>
                    <label>Pontos gerados</label>
                </div>
                <div onClick={() => { setSelected('ativo') }} className={[styles.totalAtivo, selected == 'ativo' ? styles.selected : ''].join(' ')}>
                    <span>{totalAtivo()}</span>
                    <label>Pontos disponiveis</label>
                </div>
                <div onClick={() => { setSelected('saida') }} className={[styles.totalSaida, selected == 'saida' ? styles.selected : ''].join(' ')}>
                    <span>{totalSaida()}</span>
                    <label>Pontos utilizados</label>
                </div>

            </div>
            <div hidden={selected != 'entrada'} className={styles.card}>
                <h5>Pontos gerados</h5>
                <hr />
                <PontosGerados vendas={pontosGerados}/>
            </div>
            <div hidden={selected != 'ativo'} className={styles.card}>
                <h5>Pontos disponiveis</h5>
                <hr />
                <PontosDisponiveis clientes={clientes}/>
            </div>
            <div hidden={selected != 'saida'} className={styles.card}>
                <h5>Pontos utilizados</h5>
                <hr />
                <PontosUtilizados premios={premiosRetirados}/>
            </div>
        </div>
    )
}