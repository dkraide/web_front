import IUsuario from '@/interfaces/IUsuario';
import styles from './styles.module.scss';
import { AuthContext } from '@/contexts/AuthContext';
import { useContext, useEffect, useState } from 'react';
import IVenda from '@/interfaces/IVenda';
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear } from 'date-fns';
import { api } from '@/services/apiClient';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import GraficoAnualVendas from '@/components/Relatorio/Resumo/Anual/GraficoAnualVendas';
import GraficoAnualPagamento from '@/components/Relatorio/Resumo/Anual/GraficoAnualPagamento';
import SelectAno from '@/components/Selects/SelectAno';

type searchProps = {
    ano: number
}
export type resumoMensal = {
    mes: string;
    quantidade: number;
    total: number;       // Receita total das vendas
    canceladas: number;  // Total cancelado
    faturados: number;   // Total faturado (estd === true)
    custo: number;       // Soma dos custos das vendas
    lucro: number;       // total - custo
}

export type resumoMensalPagamento = {
    descricao: string
    mes: string
    valor: number
}
export default function ResumoAnual() {
    const { getUser } = useContext(AuthContext)
    const [loading, setLoading] = useState(true);
    const [vendas, setVendas] = useState<IVenda[]>([]);
    const [search, setSearch] = useState<searchProps>({
        ano: 2025
    });

    useEffect(() => {
        loadData();
    }, [search.ano]);

    const loadData = async () => {
        if (!loading) {
            setLoading(true);
        }
        const user = await getUser();
        const d1 = format(startOfYear(new Date(search.ano, 1, 1)), 'yyyy-MM-dd');
        const d2 = format(endOfYear(new Date(search.ano, 1, 1)), 'yyyy-MM-dd');
        const url = `/Venda/List?EmpresaId=${user.empresaSelecionada}&dataIn=${d1}&datafim=${d2}&specific=true`;
        console.log(url);
        await api.get(url).then(({ data }) => {
            setVendas(data);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao buscar dados.`);
        });
        setLoading(false);
    }

    const totalMensal = (): resumoMensal[] => {
        const resumoMap = new Map<string, resumoMensal>();

        vendas.forEach((venda) => {
            const data = new Date(venda.dataVenda);
            const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            if (!resumoMap.has(key)) {
                resumoMap.set(key, {
                    quantidade: 0,
                    mes: key,
                    total: 0,
                    canceladas: 0,
                    faturados: 0,
                    custo: 0,
                    lucro: 0,
                });
            }

            const resumo = resumoMap.get(key)!;

            if (venda.statusVenda) {
                resumo.quantidade += 1;
                resumo.total += venda.valorTotal;
                resumo.custo += venda.valorCusto ?? 0;
            }
            if (!venda.statusVenda) {
                resumo.canceladas += venda.valorTotal;
            }
            if (venda.estd && venda.statusVenda) {
                resumo.faturados += venda.valorTotal;
            }
        });

        // Após calcular total e custo, calcula o lucro
        resumoMap.forEach((resumo) => {
            resumo.lucro = resumo.total - resumo.custo;
        });

        return Array.from(resumoMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([, value]) => value);
    };

    const totalPagamentoMensal = (): resumoMensalPagamento[] => {
        const resumoMap = new Map<string, resumoMensalPagamento>();

        vendas.forEach((venda) => {
            if (venda.statusVenda) {  // considera só vendas válidas (faturadas)
                const data = new Date(venda.dataVenda);
                const ano = data.getFullYear();
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const mesAno = `${ano}-${mes}`;

                venda.pagamentos.forEach((pagamento) => {
                    const chave = `${mesAno}-${pagamento.descricao}`;

                    if (!resumoMap.has(chave)) {
                        resumoMap.set(chave, {
                            mes: mesAno,
                            descricao: pagamento.descricao,
                            valor: 0,
                        });
                    }

                    const resumo = resumoMap.get(chave)!;
                    resumo.valor += pagamento.valor;
                });
            }
        });

        return Array.from(resumoMap.values()).sort((a, b) => {
            const cmpMes = a.mes.localeCompare(b.mes);
            if (cmpMes !== 0) return cmpMes;
            return a.descricao.localeCompare(b.descricao);
        });
    };



    if(loading){
        return(
            <div>

            </div>
        )
    }
    return (
        <div className={styles.container}>
            <div className={styles.select}>
                 <SelectAno width={'30%'} selected={search.ano} setSelected={(r) => {
                    setSearch({...search, ano: r})
                 }}/>
            </div>
            <div className={styles.card}>
                <h5>Resumo anual</h5>
                <GraficoAnualVendas dados={totalMensal()} />
            </div>
            <div className={styles.card}>
                <h5>Resumo anual por Pagamento</h5>
                <GraficoAnualPagamento dados={totalPagamentoMensal()} />
            </div>
        </div>
    )
}