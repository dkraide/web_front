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
import _ from 'lodash';
import GetValue from '@/components/Modals/GetValue';
import {  blobToBase64, getURLImagemMenu, sendImage} from '@/utils/functions';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import CustomButton from '@/components/ui/Buttons';

type prodEdit = {
    column: string
    defaultValue: string
    id: number
}
export default function Categorias() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IClasseMaterial[]>([])
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
            .get(`/ClasseMaterial/List?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&imagem=true`)
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
            return (p.nomeClasse + p.id.toString()).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }
    async function onToggle(id) {
        var res = await onConfirm('', id, 'VISIVELMENU');
        if(!res){
            return;
        }
        var index = _.findIndex(list, p => p.id == id);
        list[index].visivelMenu = !list[index].visivelMenu;
        setList([...list]);
    }

    async function onConfirm(value: string, id?: number, column?: string) {
        return await api.put(`/ClasseMaterial/MenuUpdateData?id=${id || prodEdit.id}
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

    function setImage(c: IClasseMaterial){
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
           var imagemstring = await blobToBase64(files[0])
            var obj = {
                imagemString: imagemstring,
                idClasseMaterial: c.idClasseMaterial,
                classeMaterialId: c.id,
                empresaid: c.empresaId
            };
            var res = await sendImage(obj);
            if(res){
                setTimeout(() => {
                loadData();
                }, 500);
            }
        }
    }
 
    const columns = [
        {
            name: '#',
            selector: (row: IClasseMaterial) => row.id,
            cell: (c: IClasseMaterial) => <PictureBox onClick={() => {setImage(c)}} url={c?.imagem?.localOnline} size={'100px'} />,
        },
        {
            name: 'Nome',
            selector: (row: IClasseMaterial) => row.nomeClasse,
            cell: (row: IClasseMaterial) => <a href={'#'} onClick={() => { setProdEdit({ column: 'NOMECLASSE', defaultValue: row.nomeClasse, id: row.id }) }}>{row["nomeClasse"]}</a>,
        },
        {
            name: 'Posicao',
            selector: (row: IClasseMaterial) => row.posicao,
            cell: (row: IClasseMaterial) => <a href={'#'} onClick={() => { setProdEdit({ column: 'POSICAO', defaultValue: row.posicao.toString(), id: row.id }) }}>{row["posicao"]}</a>,
        },
        {
            name: 'Visivel',
            selector: (row: IProduto) => row.visivelMenu,
            cell: (row: IProduto) => <div>
                 <CustomButton onClick={() => {onToggle(row.id)}} typeButton={row.visivelMenu ? 'success' : 'danger'}> {row.visivelMenu ? 'Visivel' : 'Invisivel'}</CustomButton>
            </div>,
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Categorias</h4>
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
