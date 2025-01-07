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
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv";
import { GetCurrencyBRL, LucroPorcentagem } from "@/utils/functions"
import { isMobile } from "react-device-detect"

interface searchProps {
    dateIn: string
    dateFim: string
    str: string
}
interface relatorioProps {
    classe: string
    quantidade: number
    venda: number,
    custo: number
}

export default function RelatorioClasse() {

    const [result, setResult] = useState<relatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({str: '', dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
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
        if (!loading) {
            setLoading(true);
        }
        var url = '';
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Relatorio/ClasseMaterial?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
            url = `/Relatorio/ClasseMaterial?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<relatorioProps[]>) => {
                setResult(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar relatorio. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    function getValue(field: string, prefix?: string) {
        if (!result) {
            return '0';
        }
        if(prefix == 'R$'){
            return GetCurrencyBRL(_.sumBy(result, field));

        }else{
            return `${_.sumBy(result, field).toFixed(2)}`
        }
    }
    function getHeaders() {
        [
            { label: "Classe de Material", key: "classe" },
            { label: "Quantidade", key: "quantidade" },
            { label: "Venda", key: "venda" },
            { label: "Custo", key: "custo" }
        ]
    }

    const Filtered = () => {
        return result?.filter((item) => {
            var str = `${item.classe}`.toUpperCase();
            return str.includes(search?.str?.toUpperCase())
        })
    }

    const columns = [
        {
            name: 'Classe de Material',
            selector: row => row.classe,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: row => row.quantidade,
            sortable: true,
        },
        {
            name: 'Venda',
            selector: row => row.venda,
            cell: (row) => GetCurrencyBRL(row.venda),
            sortable: true,
        },
        {
            name: 'Custo',
            selector: row => row.custo,
            cell: (row) => GetCurrencyBRL(row.custo),
            sortable: true,
        },

    ]



    const Item = (item: relatorioProps) => {
        return(
            <div key={item.classe} className={styles.item}>
                <span className={styles.qtd}>Qtd<br/><b>{item.quantidade}</b></span>
                <span className={styles.nome}>Classe<br/><b>{item.classe}</b></span>
                <span className={styles.venda}>Venda<br/><b>{GetCurrencyBRL(item.venda)}</b></span>
                <span className={styles.venda}>Custo<br/><b>{GetCurrencyBRL(item.custo)}</b></span>
                <span className={styles.venda}>Margem(R$)<br/><b>{GetCurrencyBRL(item.venda - item.custo)}</b></span>
                <span className={styles.venda}>Margem(%)<br/><b>{LucroPorcentagem(item.venda, item.custo).toFixed(2)}</b></span>

            </div>
        )
    }



    return (
        <div className={styles.container}>
            <h4>Relatorio por Classe de Material</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton style={{marginBottom: 10}} typeButton={'dark'}><CSVLink  data={result} headers={getHeaders()} filename={"relatorioClasse.csv"}>
                    Download Planilha
                </CSVLink></CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Quantidade'} value={getValue('quantidade', '')} />
                    <BoxInfo style={{ marginRight: 10, width: '30%' }} title={'Venda'} value={getValue('venda', 'R$')} />
                    <BoxInfo style={{ marginRight: 10, width: '30%' }} title={'Custo'} value={getValue('custo', 'R$')} />
                </div>
                <hr/>
                <InputGroup title={'Pesquisar'} value={search.str} onChange={(v) => {setSearch({...search, str: v.currentTarget.value})}}/>
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