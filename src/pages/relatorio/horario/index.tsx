import IVenda from '@/interfaces/IVenda';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomButton from '@/components/ui/Buttons';
import { CSVLink } from "react-csv";
import { Spinner } from 'react-bootstrap';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { isMobile } from "react-device-detect"
import CustomTable from '@/components/ui/CustomTable';
import { ExportToExcel, GetCurrencyBRL, LucroPorcentagem } from '@/utils/functions';
import BoxInfo from '@/components/ui/BoxInfo';

type relatorioProps = {
    horario: string
    vendaTotal: number
    custoTotal: number
    cancelados: number
    qtd: number
    faturados: number
    vendas: IVenda[]
}
interface searchProps {
    dateIn: string
    dateFim: string
    str: string
}
export default function Horario() {

    const [result, setResult] = useState<relatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({ str: '', dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])
    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        var url = '';
        if (!search) {
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Venda/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        } else {
            url = `/Venda/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<IVenda[]>) => {
                var ret = agruparVendasPorHora(data);
                setResult(ret);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    function agruparVendasPorHora(vendas: IVenda[]): relatorioProps[] {
        const vendasPorHora: Record<string, relatorioProps> = {};

        vendas.forEach((venda) => {
            const hora = new Date(venda.dataVenda).getHours();
            const horario = `${hora.toString().padStart(2, "0")}:00`;

            if (!vendasPorHora[horario]) {
                vendasPorHora[horario] = {
                    horario,
                    vendaTotal: 0,
                    cancelados: 0,
                    qtd: 0,
                    faturados: 0,
                    custoTotal: 0,
                    vendas: [],
                };
            }

            if(venda.statusVenda){
                vendasPorHora[horario].vendaTotal += venda.valorTotal;
                vendasPorHora[horario].custoTotal += venda.valorCusto;
                vendasPorHora[horario].qtd += 1;
                vendasPorHora[horario].vendas.push(venda);
            }
            if (!venda.statusVenda) {
                vendasPorHora[horario].cancelados += venda.valorTotal;
            }

            if (venda.estd) {
                vendasPorHora[horario].faturados += 1;
            }
        });

        return Object.values(vendasPorHora).sort((a, b) => a.horario.localeCompare(b.horario));
    }

    const Filtered = () => {
        return result?.filter((item) => {
            var str = `${item.horario}`.toUpperCase();
            return str.includes(search?.str?.toUpperCase())
        })
    }

    function getHeaders() {
       return  [
            { label: "Horario", key: "horario" },
            { label: "Quantidade", key: "qtd" },
            { label: "Venda", key: "vendaTotal" },
            { label: "Custo", key: "custoTotal" }
        ]
    }
    const columns = [
        {
            name: 'Horario',
            selector: row => row.horario,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: row => row.qtd,
            sortable: true,
        },
        {
            name: 'Venda',
            selector: row => row.vendaTotal,
            cell: (row) => GetCurrencyBRL(row.vendaTotal),
            sortable: true,
        },
        {
            name: 'Cancelados',
            selector: row => row.cancelados,
            cell: (row) => GetCurrencyBRL(row.cancelados),
            sortable: true,
        },
        {
            name: 'Custo',
            selector: row => row.custoTotal,
            cell: (row) => GetCurrencyBRL(row.custoTotal),
            sortable: true,
        },

    ]

    const Item = (item: relatorioProps) => {
        return (
            <div key={item.horario} className={styles.item}>
                <span className={styles.qtd}>Qtd<br /><b>{item.qtd}</b></span>
                <span className={styles.nome}>Horario<br /><b>{item.horario}</b></span>
                <span className={styles.venda}>Venda<br /><b>{GetCurrencyBRL(item.vendaTotal)}</b></span>
                <span className={styles.venda}>Custo<br /><b>{GetCurrencyBRL(item.custoTotal)}</b></span>
                <span className={styles.venda}>Margem(R$)<br /><b>{GetCurrencyBRL(item.vendaTotal - item.custoTotal)}</b></span>
                <span className={styles.venda}>Margem(%)<br /><b>{LucroPorcentagem(item.vendaTotal, item.custoTotal).toFixed(2)}</b></span>
            </div>
        )
    }

    const getValuePorPeriodo = (periodo: 'MANHA' | 'TARDE' | 'NOITE') : number => {
        let range: [number, number];

        switch (periodo) {
            case 'MANHA':
                range = [6, 12]; // 06:00 - 12:00
                break;
            case 'TARDE':
                range = [12, 18]; // 12:00 - 18:00
                break;
            case 'NOITE':
                range = [18, 23]; // 18:00 - 23:00
                break;
            default:
                return 0;
        }

        return result.filter((venda) => {
            const hora = parseInt(venda.horario.split(':')[0], 10);
            return hora >= range[0] && hora < range[1];
        })
            .reduce((total, venda) => total + venda.vendaTotal, 0);
    }
    return (
        <div className={styles.container}>
            <h4>Relatorio por Horario</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={() => {
                    ExportToExcel(getHeaders(), result, 'relatorioHorario')
                }} typeButton={'dark'}>Excel</CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Manha'} value={GetCurrencyBRL(getValuePorPeriodo('MANHA'))} />
                    <BoxInfo style={{ marginRight: 10, width: '30%' }} title={'Tarde'} value={GetCurrencyBRL(getValuePorPeriodo('TARDE'))} />
                    <BoxInfo style={{ marginRight: 10, width: '30%' }} title={'Noite'} value={GetCurrencyBRL(getValuePorPeriodo('NOITE'))} />
                </div>
                <hr />
                <InputGroup title={'Pesquisar'} value={search.str} onChange={(v) => { setSearch({ ...search, str: v.currentTarget.value }) }} />
                {isMobile ? <>
                    <div className={styles.items}>
                        {Filtered()?.map((item) => Item(item))}
                    </div>
                </> : <>
                    <CustomTable
                        columns={columns}
                        data={Filtered()}
                        loading={loading}
                    />
                </>}
            </div>}
        </div>
    )

}