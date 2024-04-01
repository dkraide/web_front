import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEye } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import ProdutoForm from '@/components/Modals/Produto';
import EstoqueForm from '@/components/Modals/Produto/EstoqueForm';
import BoxInfo from '@/components/ui/BoxInfo';
import _ from 'lodash';
import { CSVLink } from "react-csv";


export default function Estoque() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IProduto[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
       var u: any;
       if(!user){
        var res = await getUser();
        setUser(res);
        u = res;
        }
        await api
            .get(`/Estoque/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getHeaders() {
        [
            { label: "Cod", key: "cod" },
            { label: "Descricao", key: "nome" },
            { label: "Quantidade", key: "quantidade" },
            { label: "Compra", key: "compra" },
            { label: "Venda", key: "venda" }
        ]
    }
    function getDataCsv(){
        var res = getFiltered().map((p) =>{
            return  {
               cod: p.cod,
               descricao: p.nome,
               quantidade: p.quantidade,
               compra: p.valorCompra * (p.quantidade > 0 ? p.quantidade : 0),
               venda: p.valor * (p.quantidade > 0 ? p.quantidade : 0),
            }
        });
        return res;
    }

    function getFiltered() {
        var res = list.filter(p => {
            return (p.nome + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }

    const columns = [
        {
            name: '#',
            cell: ({ id }: IProduto) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'primary'}><FontAwesomeIcon icon={faEye}/></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Cod',
            selector: row => row['cod'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Nome',
            selector: row => row['nome'],
            sortable: true,
        },
        {
            name: 'Estoque',
            selector: row => row['quantidade'],
            cell: row => row.quantidade.toFixed(2),
            sortable: true,
            width: '10%'
        },
        {
            name: 'Estoque Min.',
            selector: row => row.quantidadeMinima,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Custo Un.',
            selector: row => row['valorCompra'],
            cell: row => `R$ ${row.valorCompra.toFixed(2)}`,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Custo Total',
            selector: row => row['valorCompra'],
            cell: row => row.quantidade >= 0 ? `R$ ${(row.valorCompra * row.quantidade).toFixed(2)}`: `R$ 0.00`,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Venda Total',
            selector: row => row['valor'],
            cell: (row: IProduto) => row.quantidade >= 0 ? `R$ ${(row.valor * row.quantidade).toFixed(2)}`: `R$ 0.00`,
            sortable: true,
            width: '10%'
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Produtos</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <hr/>
            <div className={styles.box}>
            <BoxInfo style={{ marginRight: 10 }} title={'Estoque'} value={_.sumBy(list, x => x.quantidade > 0 ? x.quantidade : 0).toFixed(2)}/>
            <BoxInfo style={{ marginRight: 10 }} title={'Valor'} value={`R$ ${_.sumBy(list, x => x.quantidade > 0 ? x.quantidade * x.valor : 0).toFixed(2)}`}/>
            <BoxInfo style={{ marginRight: 10 }} title={'Compra'} value={`R$ ${_.sumBy(list, x => x.quantidade > 0 ? x.quantidade * x.valorCompra : 0).toFixed(2)}`}/>
            </div>
            <hr/>
            <CustomButton style={{ marginBottom: 10 }} typeButton={'dark'}><CSVLink style={{ padding: 10 }} data={getDataCsv()} headers={getHeaders()} filename={"relatorio_estoque.csv"}>
                Download Planilha
            </CSVLink></CustomButton>
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <EstoqueForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
