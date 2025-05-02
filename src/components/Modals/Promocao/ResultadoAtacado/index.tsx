

import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import axios, { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm, InputGroup } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import { GetCurrencyBRL, isMobile, validateString } from "@/utils/functions";
import { endOfMonth, format, startOfMonth } from "date-fns";
import IVendaProduto from "@/interfaces/IVendaProduto";
import BoxInfo from "@/components/ui/BoxInfo";
import _ from "lodash";
import CustomTable from "@/components/ui/CustomTable";



interface props {
    isOpen: boolean
    promocaoId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
type searchProps = {
    ini: string
    end: string
    str: string
}
type responseProps = {
    produtos: {
        produto: string
        vendas: IVendaProduto[]
        total: number
        custo: number
        qntd: number
    }[];
    total: number
    custo: number
    qntd: number
}
export default function ResultadoAtacado({ user, isOpen, promocaoId, setClose, color }: props) {
    const [search, setSearch] = useState<searchProps>({
        ini: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        str: ''
    });
    const [itens, setItens] = useState<responseProps>({} as any)
    const [loading, setLoading] = useState<boolean>(true)
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        if(!loading)
            setLoading(true);

        await api.get(`/Relatorio/Promocao?empresaid=${user.empresaSelecionada}&dataIn=${search.ini}&dataFim=${search.end}&promocaoId=${promocaoId}`).then(({data}) => {
            setItens(data);
            console.log(data);
        }).catch((err) => {
            toast.error(`Erro ao buscar dados.`)
        })
        setLoading(false);
    }

    const columns = [
        {
            name: 'Produto',
            selector: row => row.produto,
            sortable: true,
            width: '50%'
        },
        {
            name: 'Qtd',
            selector: row => row.total,
            sortable: true,
        },
        {
            name: 'Custo',
            cell: (row) => <>{GetCurrencyBRL(row.custo)}</>,
            sortable: true,
        },
        {
            name: 'Total',
            selector: row => row.total,
            cell: (row) => <>{GetCurrencyBRL(row.total)}</>,
            sortable: true,
        },

    ]
    return (
        <BaseModal height={'30%'} width={'50%'} color={color} title={'Resultado de vendas por Promocao'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.boxSearch}>
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.ini} onChange={(v) => { setSearch({ ...search, ini: v.target.value }) }} title={'Inicio'} width={'20%'} />
                        <InputGroup minWidth={'275px'} type={'date'} value={search?.end} onChange={(v) => { setSearch({ ...search, end: v.target.value }) }} title={'Final'} width={'20%'} />
                        <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
                        <InputGroup minWidth={'275px'}  value={search?.str} onChange={(v) => { setSearch({ ...search, str: v.target.value }) }} title={'Filtrar por nome'} width={'100%'} />
                    </div>
                    <div className={styles.box}>
                        <BoxInfo style={{ marginRight: 10 }} title={'Total'} value={GetCurrencyBRL(itens.total)} />
                        <BoxInfo style={{ marginRight: 10 }} title={'Custo'} value={GetCurrencyBRL(itens.custo)} />
                        <BoxInfo style={{ marginRight: 10 }} title={'Qtd'}  value={itens.qntd.toString()} />
                    </div>
                    <div className={styles.items}>
                        <CustomTable
                        columns={columns}
                        data={itens.produtos}
                        />
                    </div>
                </div>
            )}
        </BaseModal>
    )
}