"use client";

import { useEffect, useState, useContext } from "react"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import CustomTable from "@/components/ui/CustomTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import { fGetNumber } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEdit } from "@fortawesome/free-solid-svg-icons"
import LancamentoEstoqueForm from "@/components/Modals/Produto/LancamentoEstoqueForm"
import UnderConstruction from "@/components/ui/UnderConstruction"
import { isMobile } from "react-device-detect"
import { LabelGroup } from "@/components/ui/LabelGroup"
import { canSSRAuth } from "@/utils/CanSSRAuth"
import { useRouter } from "next/router";

interface searchProps {
    dateIn: string
    dateFim: string
}

export default function EstoqueLancamento() {

    const [vendas, setVendas] = useState<ILancamentoEstoque[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') })
    const [edit, setEdit] = useState(-1)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const router = useRouter();
    const [mobile, setMobile] = useState(false);
    useEffect(() => {
        setMobile(isMobile);
    }, []);

    useEffect(() => {
        loadData();
    }, [])

    const loadData = async () => {
        var u = await getUser();
        if (!user) {
            setUser(u);
        }
        let url = `/v2/LancamentoEstoque/${u.empresaSelecionada}/lancamentos?dataIn=${search.dateIn}&dataFim=${search.dateFim}&isProduto=true`;
        await api.get(url)
            .then(({ data }: AxiosResponse<ILancamentoEstoque[]>) => {
                setVendas(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar lançamentos. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }) => <CustomButton onClick={() => { setEdit(id) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Online',
            selector: row => row['id'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Local',
            selector: row => row['idLancamentoEstoque'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Data',
            selector: row => row['dataLancamento'],
            cell: row => format(new Date(row.dataLancamento), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Tipo',
            selector: row => row['isEntrada'],
            cell: row => row.isEntrada ? 'ENTRADA' : 'SAIDA',
            sortable: true,
        },
    ]

    const ItemMobile = (item: ILancamentoEstoque) => {
        return (
            <div  onClick={() => { setEdit(item.id) }} key={item.id} className={styles.itemMobile}>
                <LabelGroup width={'20%'} title={'Nro'} value={item.id.toString()} />
                <LabelGroup width={'20%'} title={'Local'} value={item.idLancamentoEstoque.toString()} />
                <LabelGroup width={'60%'} title={'Data'} value={format(new Date(item.dataLancamento), 'dd/MM/yyyy')} />
                <LabelGroup width={'20%'} title={'Tipo'} value={item.isEntrada ? 'ENTRADA' : 'SAIDA'} />
                <LabelGroup width={'80%'} title={'Comentário'} value={item.comentario} />

            </div>
        )
    }

    return (
        <div className={styles.container}>
            <h4>Lançamentos De Estoque</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton style={{ width: mobile ? '100%' : '150px' }} onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <div className={styles[mobile ? 'buttonsMobile' : 'buttons']}>
                <span>Cadastrar</span>
                <CustomButton typeButton={'dark'} onClick={() => { setEdit(0) }} style={{ marginRight: 10 }} >Manual</CustomButton>
                <CustomButton typeButton={'dark'} onClick={() => { router.push(`/estoqueLancamento/xml`) }} >Com XML/Excel</CustomButton>
                <CustomButton typeButton={'dark'} onClick={() => { router.push(`/estoqueLancamento/ia`) }} >Com I.A</CustomButton>
            </div>
            <hr />
            {mobile ? (
                <>
                    {vendas.map((item, index) => ItemMobile(item))}
                </>

            ) : (
                <>
                    <CustomTable
                        columns={columns}
                        data={vendas}
                        loading={loading}
                    />
                </>

            )
            }
            {
                (edit >= 0) && <LancamentoEstoqueForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                    if (v) {
                        loadData();
                    }
                    setEdit(-1);
                }} />
            }
        </div >
    )
}
export const getServerSideProps = canSSRAuth(async (ctx) => {
    return {
        props: {

        }
    }
})