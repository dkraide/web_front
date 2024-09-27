import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import IUsuario from '@/interfaces/IUsuario';
import IProduto from '@/interfaces/IProduto';
import PictureBox from '@/components/ui/PictureBox';
import Toggle from 'react-bootstrap-toggle';
import _ from 'lodash';
import GetValue from '@/components/Modals/GetValue';
import {  blobToBase64, getURLImagemMenu, sendImage} from '@/utils/functions';
import IPromocao from '@/interfaces/IPromocao';
import AtacadoForm from '@/components/Modals/Promocao/AtacadoForm';
import CustomButton from '@/components/ui/Buttons';

type prodEdit = {
    column: string
    defaultValue: string
    id: number
}
export default function Promocoes() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IPromocao[]>([])
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
            .get(`/Promocao/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&imagem=true`)
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
            return ((p.produto?.nome || '') + (p.classeMaterial?.nomeClasse || '') + p.id.toString()).toLowerCase().includes(search.toLowerCase())
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
        return await api.put(`/Promocao/MenuUpdateData?id=${id || prodEdit.id}
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

    function setImage(p: IPromocao){
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            setLoading(true);
            var str = await sendImage(files);
            if(str){
                p.localPath = str;
                await api.put(`/Promocao/UpdatePromocao`, p).then(({data}) => {
                    toast.success('Promocao atualizado com sucessso!');
                    loadData();
                }).catch((err) => {
                    toast.error(`Erro ao atualizar o Promocao`);

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
            cell: (p: IPromocao) => <PictureBox onClick={() => {setImage(p)}} url={p.localPath} size={'100px'} />,
        },
        {
            name: 'Nome',
            cell: (row: IPromocao) => <a href={'#'} onClick={() => { setProdEdit({ column: 'ITEM', defaultValue: row.id.toString(), id: row.id }) }}>{row['produto'] ? row.produto.nome : row.classeMaterial.nomeClasse}</a>,
        },
        {
            name: 'Quantidade',
            selector: (row: IPromocao) => row.quantidade,
            cell: (row: IPromocao) => <a href={'#'} onClick={() => { setProdEdit({ column: 'QUANTIDADE', defaultValue: row.quantidade.toString(), id: row.id }) }}>{row['quantidade'].toFixed(2)}</a>,
        },
        {
            name: 'Valor Final',
            selector: (row: IPromocao) => row.valorFinal,
            cell: (row: IPromocao) => <a href={'#'} onClick={() => { setProdEdit({ column: 'VALORFINAL', defaultValue: row.valorFinal.toFixed(2), id: row.id }) }}>R${row['valorFinal'].toFixed(2)}</a>,
        },
        {
            name: 'Posicao',
            selector: (row: IPromocao) => row.posicao,
            cell: (row: IPromocao) => <a href={'#'} onClick={() => { setProdEdit({ column: 'POSICAO', defaultValue: row.posicao.toString(), id: row.id }) }}>{row["posicao"]}</a>,
        },
        {
            name: 'Visivel',
            selector: (row: IPromocao) => row.visivelMenu,
            cell: (row: IPromocao) => <div>
                <CustomButton onClick={() => {onToggle(row.id)}} typeButton={row.visivelMenu ? 'success' : 'danger'}> {row.visivelMenu ? 'Visivel' : 'Invisivel'}</CustomButton>
            </div>,
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Promocoes</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {(prodEdit && prodEdit.column !== 'ITEM') && <GetValue defaultValue={prodEdit.defaultValue} isOpen={prodEdit != undefined} title={prodEdit.column} setClose={() => { setProdEdit(undefined) }} onConfirm={onConfirm} />}
            {(prodEdit && prodEdit.column === 'ITEM') && <AtacadoForm user={user} setClose={(v) => {
                if(v){
                    loadData();
                }
                setProdEdit(undefined);
            }} id={prodEdit.id} isOpen={prodEdit.column === 'ITEM'} />}

        </div>
    )
}
