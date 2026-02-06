import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import ProdutoForm from '@/components/Modals/Produto';
import PictureBox from '@/components/ui/PictureBox';
import Toggle from 'react-bootstrap-toggle';
import _ from 'lodash';
import GetValue from '@/components/Modals/GetValue';
import {  blobToBase64, getURLImagemMenu, sendImage} from '@/utils/functions';

type prodEdit = {
    column: string
    defaultValue: string
    id: number
}
export default function Produtos() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IProduto[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [user, setUser] = useState<IUsuario>()
    const [prodEdit, setProdEdit] = useState<prodEdit | undefined>()

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/Produto/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&imagem=true`)
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
            return (p.nome + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }
    async function onToggle(id) {
        var res = await onConfirm('true', id, 'VISIVELMENU');
        if(!res){
            return;
        }
        var index = _.findIndex(list, p => p.id == id);
        list[index].visivelMenu = !list[index].visivelMenu;
        setList([...list]);
    }

    async function onConfirm(value: string, id?: number, column?: string) {
        return await api.put(`/Produto/MenuUpdateData?id=${id || prodEdit.id}
     &column=${column || prodEdit.column}&value=${value}`)
            .then(({ data }: AxiosResponse) => {
                toast.success('Campo atualizado com sucesso');
                setProdEdit(undefined);
                loadData();
                return true;
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar campo. ${err.response?.data || err.message}`);
                return false;
            });
    }

    function setImage(p: IProduto){
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            setTimeout(() => {
            }, 500)
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            setLoading(true);
            var str = await sendImage(files);
            if(str){
                p.localPath = str;
                await api.put(`/Produto/UpdateProduct`, p).then(({data}) => {
                    toast.success('Produto atualizado com sucessso!');
                    loadData();
                }).catch((err) => {
                    toast.error(`Erro ao atualizar o produto`);
                });
            }else{
                toast.error(`Erro ao enviar imagem`);
            }
            setLoading(false);
        }
    }
 
    const columns = [
        {
            name: '#',
            selector: (row: IProduto) => row.id,
            cell: (p: IProduto) => <PictureBox onClick={() => {setImage(p)}} url={p.localPath} size={'100px'} />,
            sortable: true,
        },
        {
            name: 'Nome',
            selector: (row: IProduto) => row.nome,
            cell: (row: IProduto) => <a href={'#'} onClick={() => { setProdEdit({ column: 'NOME', defaultValue: row.nome, id: row.id }) }}>{row["nome"]}</a>,
            sortable: true,
        },
        {
            name: 'Venda',
            selector: (row: IProduto) => row.valor,
            cell: (row: IProduto) => <a href={'#'} onClick={() => { setProdEdit({ column: 'VALOR', defaultValue: row.valor.toFixed(2), id: row.id }) }}>R$ {row['valor'].toFixed(2)}</a>,
            sortable: true,
        },
        {
            name: 'Posicao',
            selector: (row: IProduto) => row.posicao,
            cell: (row: IProduto) => <a href={'#'} onClick={() => { setProdEdit({ column: 'POSICAO', defaultValue: row.posicao.toString(), id: row.id }) }}>{row["posicao"]}</a>,
            sortable: true,
        },
        {
            name: 'Visivel',
            selector: (row: IProduto) => row.visivelMenu,
            cell: (row: IProduto) => <div>
            <CustomButton onClick={() => {onToggle(row.id)}} typeButton={row.visivelMenu ? 'success' : 'danger'}> {row.visivelMenu ? 'Visivel' : 'Invisivel'}</CustomButton>,
            </div>,
            sortable: true,
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Produtos</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {prodEdit && <GetValue defaultValue={prodEdit.defaultValue} isOpen={prodEdit != undefined} title={prodEdit.column} setClose={() => { setProdEdit(undefined) }} onConfirm={onConfirm} />}

        </div>
    )
}
