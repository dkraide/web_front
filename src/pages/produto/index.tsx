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
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import ProdutoForm from '@/components/Modals/Produto';
import AjusteEmMassa from '@/components/Modals/Produto/AjusteEmMassa';
import { useWindowSize } from 'rooks';
import ProdutoMobile from '@/components/Mobile/Pages/Produto/ProdutoMobile';
import { ExportToExcel } from '@/utils/functions';
import NovoProdutoForm from '@/components/Modals/Produto/NovoProdutoForm';
import EstoqueForm from '@/components/Modals/Produto/EstoqueForm';

type searchProps = {
    str: string,
    edit: number
    ajuste: boolean
    viewEstoque: number
}

export default function Produto() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IProduto[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState<searchProps>({
        str: '',
        edit: -1,
        ajuste: false,
        viewEstoque: 0
    });
    const [user, setUser] = useState<IUsuario>();
    const { innerWidth } = useWindowSize();
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        if (!innerWidth) {
            return;
        }
        setMobile(innerWidth < 600);

    }, [innerWidth])



    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/Produto/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
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

    function getFiltered() {
        var res = list.filter(p => {
            return (p.nome + p.id.toString()).toLowerCase().includes(search.str.toLowerCase())
        });
        return res;
    }

    const handleEdit = (produto: IProduto) => {
        if (produto.tipo == "PIZZA") {
            window.location.href = `/produto/novaPizza?id=${produto.id}`;
            return;
        }
        if (produto.tipo == "PRATO") {
            window.location.href = `/produto/novoPrato?id=${produto.id}`;
            return;

        }
        setSearch({...search, edit: produto.id})
    }

    function setImage(id: number) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            setTimeout(() => {
            }, 500)
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            setTimeout(() => {
            }, 500)
            setLoading(true);
            await api.post(`/Produto/${id}/UploadImagem`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
                .then(({ data }) => {
                    loadData();
                }).catch((err) => {

                    toast.error(`Erro ao tentar salvar imagem.`);
                    setLoading(false);
                })
        }
    }


    const columns = [
        {
            name: '#',
            cell: (produto: IProduto) => <CustomButton onClick={() => { handleEdit(produto) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faEdit} /></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Imagem',
            cell: ({ localPath, id }: IProduto) => <div
                onClick={() => {
                    setImage(id);
                }}
                style={{
                    cursor: 'pointer'
                }}
            >
                <img
                    style={{
                        width: 85,
                        height: 85,
                        padding: 5
                    }}
                    src={localPath ?? '/nopic.png'}
                    onError={(e) => { e.currentTarget.src = '/nopic.png' }}
                />

            </div>,
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
            cell: (row) => <a style={{color: 'var(--main)'}} href={'#'} onClick={() => {
                setSearch({...search, viewEstoque: row.id})
            }}>{row.quantidade}</a>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Custo',
            selector: row => row['valorCompra'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Venda',
            selector: row => row['valor'],
            sortable: true,
            grow: 0
        },
        {
            name: 'Status',
            selector: row => row['status'] ? 'Ativo' : 'Inativo',
            sortable: true,
            grow: 0
        },
        {
            name: 'Lucro',
            cell: (row: IProduto) => {
                const margem = row.valor > 0 ? ((row.valor - row.valorCompra) / row.valor) * 100 : 0;
                return `${margem.toFixed(2)}%`;
            },
            sortable: true,
            grow: 0
        },
        {
            name: 'Markup',
            cell: (row: IProduto) => {
                const markup = row.valorCompra > 0 ? ((row.valor - row.valorCompra) / row.valorCompra) * 100 : 0;
                return `${markup.toFixed(2)}%`;
            },
            sortable: true,
            grow: 0
        },
    ]

    const handleNovaPizza = () => {
        window.location.href = '/produto/novaPizza';
    }
    const handleNovoPrato = () => {
        window.location.href = '/produto/novoPrato';
    }

    const handleExcel = () => {

        const columns = [
            { label: 'Cod', key: 'cod' },
            { label: 'Nome', key: 'nome' },
            { label: 'Estoque', key: 'quantidade' },
            { label: 'Custo', key: 'valorCompra' },
            { label: 'Venda', key: 'valor' },
            { label: 'Status', key: 'status' },
            { label: 'Lucro', key: 'lucro' },
            { label: 'Markup', key: 'markup' }
        ];

        const data = getFiltered().map(produto => ({
            cod: produto.cod,
            nome: produto.nome,
            quantidade: produto.quantidade,
            valorCompra: produto.valorCompra,
            valor: produto.valor,
            status: produto.status ? 'Ativo' : 'Inativo',
            lucro: ((produto.valor - produto.valorCompra) / produto.valor * 100).toFixed(2) + '%',
            markup: ((produto.valor - produto.valorCompra) / produto.valorCompra * 100).toFixed(2) + '%'
        }));

        ExportToExcel(columns, data, 'Produtos');





    }

    if (mobile) {
        return <ProdutoMobile produtos={list} user={user} loadData={loadData} handleNovaPizza={handleNovaPizza} handleNovoPrato={handleNovoPrato} />
    }
    return (
        <div className={styles.container}>
            <h4>Produtos</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search.str} onChange={(e) => { setSearch({...search, str: e.currentTarget.value}) }} />
            <CustomButton typeButton={'dark'} onClick={() => { setSearch({...search, edit: 0}) }} >Novo Produto</CustomButton>
            <CustomButton typeButton={'dark'} onClick={handleNovaPizza} style={{ marginLeft: '10px' }} >Nova Pizza</CustomButton>
            <CustomButton typeButton={'dark'} onClick={handleNovoPrato} style={{ marginLeft: '10px' }}  >Novo Prato</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => { window.location.href = '/produto/franquia' }} style={{ marginLeft: '10px' }} >Franquia</CustomButton>
            <CustomButton typeButton={'dark'} onClick={() => { setSearch({...search, ajuste: true}) }} style={{ marginLeft: '10px' }}>Ajuste Massa</CustomButton>
            <CustomButton typeButton={'dark'} onClick={handleExcel} style={{ marginLeft: '10px' }}>Excel</CustomButton>
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {(search.edit == 0) && <NovoProdutoForm user={user} isOpen={search.edit >= 0} setClose={(v) => {
                if (v) {
                    loadData();
                }
                 setSearch({...search, edit: -1});
            }} />}
            {(search.edit > 0) && <ProdutoForm user={user} isOpen={search.edit >= 0} id={search.edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                 setSearch({...search, edit: -1});
            }} />}
            {search.ajuste && <AjusteEmMassa isOpen={search.ajuste} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setSearch({...search, ajuste: false});
            }} />}
            {search.viewEstoque > 0 && <EstoqueForm user={user} id={search.viewEstoque} isOpen={search.viewEstoque > 0} setClose={(v) => {
                  if(v){
                    loadData();
                  }
                  setSearch({...search, viewEstoque: 0})
            }}
            />}

        </div>
    )
}
