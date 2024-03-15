import { ReactNode, useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { Axios, AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import Loading from '@/components/Loading';
import IEmpresa from '@/interfaces/IEmpresa';
import _, { padEnd } from 'lodash';
import SelectProdutoModal from '@/components/Modals/Produto/SelectProdutoModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';


type resProps = {
    matriz: IProduto
    filiais?: IProduto[]
}
type onSelProduto = {
    filialId: number
    matrizIndex: number
    selected?: number
}


export default function Franquia() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<resProps[]>([])
    const [empresas, setEmpresas] = useState<IEmpresa[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [user, setUser] = useState<IUsuario>()
    const [getProduto, setGetProduto] = useState<onSelProduto | undefined>(undefined);
    const [loadingField, setLoadingField] = useState(false);


    const [selected, setSelected] = useState(-1);

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/Produto/Franquia?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar produtos. ${err.response?.data || err.message}`);
            });
        await api
            .get(`/Empresa/GetEmpresas`)
            .then(({ data }: AxiosResponse) => {
                setEmpresas(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar empresa. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    if (loading) {
        return <Loading />
    }

    function getHead() {
        return <thead>
            <tr>
                {empresas?.map((p) => <th>{p.isMatriz ? '(MATRIZ)' : ''} {p.nomeFantasia}</th>)}
            </tr>
        </thead>
    }
    async function vincularComMatriz(produto: IProduto) {

        if (!getProduto) {
            toast.error(`Erro ao buscar matriz`);
            return;
        }
        var obj = {
            matrizId: list[getProduto.matrizIndex].matriz.empresaId,
            produtoMatrizId: list[getProduto.matrizIndex].matriz.id,
            filialId: produto.empresaId,
            produtoFilialId: produto.id
        }
        setLoading(true);
        await api.post(`/Produto/VincularMatriz`, obj)
            .then((response) => {
                toast.success('Produto vinculado com sucesso!');
                var prodIndex = _.findIndex(list[getProduto.matrizIndex].filiais, p => p.id == getProduto.selected);
                if (prodIndex < 0) {
                    list[getProduto.matrizIndex].filiais.push(produto);
                } else {
                    list[getProduto.matrizIndex].filiais[prodIndex] = produto;
                    console.log('caiu aqui');
                }
                setList([...list]);
                setGetProduto(undefined);

            }).catch((err) => {
                toast.error(`Erro ao vincular com matriz.`);
                return;
            })
        setLoading(false);
    }

    function getValue(produto: resProps, field: string) {
        return empresas?.map((empresa) => {
            if (empresa.isMatriz) {
                return <></>
            }
            var prodFranquia = _.findIndex(produto.filiais, p => p.empresaId == empresa.id);
            if (prodFranquia >= 0) {
                var value = produto.filiais[prodFranquia][field];
                if (value === true) {
                    value = "ATIVO";
                }
                if (value === false) {
                    value = "INATIVO";
                }
                return <td>
                    <a>
                        <CustomButton
                            typeButton={'main'}
                            onClick={() => {
                                setValue(produto.filiais[prodFranquia].id, produto.matriz[field], field, prodFranquia)
                            }}>
                            <FontAwesomeIcon icon={faEdit} />
                        </CustomButton>{value}
                    </a>
                </td>
            } else {
                return <td> --</td>
            }
        })
    }

    async function setValue(produtoId: number, value: string, field: string, indexFilial: number) {
        setLoadingField(true);
        await api.put(`/Produto/UpdateField?produtoId=${produtoId}&value=${value}&field=${field}`).then(({ data }: AxiosResponse<IProduto>) => {
            list[selected].filiais[indexFilial] = data;
            setList([...list]);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao atualizar campo. ${err.response?.data || err.message}`);
        })
        setLoadingField(false);

    }
    function getBody() {
        return (
            <tbody>
                {list?.map((produto, index) => {
                    return (
                        <>
                            <tr >
                                <td>
                                    <a
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            if (selected == index) {
                                                setSelected(-1);
                                            } else {
                                                setSelected(index)
                                            }
                                        }}>{produto.matriz.nome}
                                    </a>
                                </td>
                                {empresas?.map((empresa) => {
                                    if (empresa.isMatriz) {
                                        return <></>
                                    }
                                    var prodFranquia = _.findIndex(produto.filiais, p => p.empresaId == empresa.id);
                                    if (prodFranquia >= 0) {
                                        return <td>
                                            <CustomButton
                                            style={{marginRight: 10}}
                                                typeButton={'main'}
                                                onClick={() => {
                                                    setValue(produto.filiais[prodFranquia].id, produto.matriz.nome, "nome",
                                                        prodFranquia)
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </CustomButton>
                                            <a style={{ cursor: 'pointer', color: hasDiff(produto.matriz, produto.filiais[prodFranquia]) ? 'var(--main)' : '' }} onClick={() => {
                                                setGetProduto({
                                                    filialId: empresa.id,
                                                    matrizIndex: index,
                                                    selected: produto.filiais[prodFranquia].id
                                                })
                                            }}>{produto.filiais[prodFranquia].nome}</a></td>
                                    } else {
                                        return <td><CustomButton typeButton={'success'} onClick={() => {
                                            setGetProduto({
                                                filialId: empresa.id,
                                                matrizIndex: index,
                                            })
                                        }}>Selecionar Produto</CustomButton></td>
                                    }
                                })}
                            </tr>
                            {loadingField &&
                                (
                                    <tr>
                                        <td colSpan={empresas.length}>
                                            <Loading />
                                        </td>
                                    </tr>
                                )}
                            {(selected >= 0 && index == selected && !loadingField) &&
                                (
                                    <tr>
                                        <td colSpan={empresas.length}>
                                            <table className={'table'}>
                                                {getHead()}
                                                <tbody>
                                                    <tr>
                                                        <td>Valor Venda <br />  {produto.matriz.valor}</td>
                                                        {getValue(produto, "valor")}
                                                    </tr>
                                                    <tr>
                                                        <td>Valor Compra <br /> {produto.matriz.valorCompra}</td>
                                                        {getValue(produto, "valorCompra")}
                                                    </tr>
                                                    <tr>
                                                        <td>Multiplicador <br /> {produto.matriz.multiplicadorFornecedor}</td>
                                                        {getValue(produto, "multiplicadorFornecedor")}
                                                    </tr>
                                                    <tr>
                                                        <td>Status <br /> {produto.matriz.status ? "ATIVO" : "INATIVO"}</td>
                                                        {getValue(produto, "status")}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                        </>
                    )
                })}
            </tbody>
        )

    }

    function hasDiff(m: IProduto, p: IProduto) {
        var has = false;
        if (p.status != m.status || p.valor != m.valor || p.nome != m.nome || p.valorCompra != m.valorCompra || p.multiplicadorFornecedor != m.multiplicadorFornecedor) {
            has = true;
        }
        return has;
    }
    return (

        <div className={styles.container}>
            <h4>Produtos Franquia</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <table className={'table'}>
                {getHead()}
                {getBody()}
            </table>
            {getProduto && <SelectProdutoModal selectedId={getProduto.selected} empresaId={getProduto.filialId} isOpen={getProduto != undefined} setClose={(produto) => {
                if (produto) {
                    vincularComMatriz(produto)
                } else {
                    setGetProduto(undefined);
                }
            }} />}
        </div>
    )
}
