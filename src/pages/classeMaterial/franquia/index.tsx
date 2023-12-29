import { ReactNode, useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import Loading from '@/components/Loading';
import IEmpresa from '@/interfaces/IEmpresa';
import _ from 'lodash';
import SelectProdutoModal from '@/components/Modals/Produto/SelectProdutoModal';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import SelectClasseModal from '@/components/Modals/ClasseMaterial/SelectClasseModal';


type resProps = {
    matriz: IClasseMaterial
    filiais?: IClasseMaterial[]
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

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/ClasseMaterial/Franquia?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar classes. ${err.response?.data || err.message}`);
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

    function getHead(){
        return <thead>
            <tr>
                {empresas?.map((p) => <th>{p.isMatriz ? '(MATRIZ)' : ''} {p.nomeFantasia}</th>)}
            </tr>
            </thead>
    }
    async function vincularComMatriz(produto: IClasseMaterial){

        if(!getProduto){
            toast.error(`Erro ao buscar matriz`);
            return;
        }
        var obj = {
            matrizId: list[getProduto.matrizIndex].matriz.empresaId,
            classeMaterialMatrizId: list[getProduto.matrizIndex].matriz.id,
            filialId: produto.empresaId,
            classeMaterialFilialId: produto.id
        }
        setLoading(true);
        await api.post(`/ClasseMaterial/VincularMatriz`, obj)
        .then((response) => {
            toast.success('Classe vinculado com sucesso!');
            var prodIndex = _.findIndex(list[getProduto.matrizIndex].filiais, p => p.id == getProduto.selected);
            if(prodIndex < 0){
                list[getProduto.matrizIndex].filiais.push(produto);
            }else{
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
    function getBody(){
        return(
            <tbody>
                {list?.map((produto, index) => {
                    return(
                        <tr>
                            <td>{produto.matriz.nomeClasse}</td>
                            {empresas?.map((empresa) => {
                                if(empresa.isMatriz){
                                    return <></>
                                }
                                var prodFranquia = _.findIndex(produto.filiais, p => p.empresaId == empresa.id);
                                if(prodFranquia >= 0){
                                            return <td><a href={'#'} onClick={() => {
                                                setGetProduto({
                                                    filialId: empresa.id,
                                                    matrizIndex: index,
                                                    selected: produto.filiais[prodFranquia].id
                                                })
                                            }}>{produto.filiais[prodFranquia].nomeClasse}</a></td>
                                }else{
                                    return <td><CustomButton typeButton={'success'} onClick={() => {
                                        setGetProduto({
                                            filialId: empresa.id,
                                            matrizIndex: index,
                                        })
                                    }}>Selecionar Produto</CustomButton></td>
                                }
                            })}
                        </tr>
                    )
                })}
            </tbody>
        )

    }
    return (

        <div className={styles.container}>
            <h4>Classes Franquia</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <table className={'table'}>
                {getHead()}
                {getBody()}
            </table>
            {getProduto && <SelectClasseModal selectedId={getProduto.selected} empresaId={getProduto.filialId} isOpen={getProduto != undefined} setClose={(produto) => {
                            if(produto){
                                vincularComMatriz(produto)
                            }else{
                            setGetProduto(undefined);
                            }
            }}  />}
        </div>
    )
}
