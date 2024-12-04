import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import SelectStatus from "@/components/Selects/SelectStatus";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { fGetNumber, sendImage , validateString } from "@/utils/functions";
import PictureBox from "@/components/ui/PictureBox";
import IGrupoAdicional, { IGrupoAdicionalMateriaPrima } from "@/interfaces/IGrupoAdicional";
import BaseModal from "@/components/Modals/Base/Index";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomTable from "@/components/ui/CustomTable";
import _ from "lodash";
import VincularMateriaGrupo from "../VincularMateriaGrupo";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function CadastroGrupoForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [classe, setClasse] = useState<IGrupoAdicional>({} as IGrupoAdicional)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [modalItem, setModalItem] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/GrupoAdicional/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IGrupoAdicional>) => {
                    setClasse(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            classe.id = 0;
            classe.status = true;
            setClasse(classe);
            setLoading(false);
        }

    }, []);
    const onSubmit = async (data: any) => {
        setSending(true);
        classe.descricao = data.descricao;
        classe.minimo = fGetNumber(data.minimo);
        classe.maximo = fGetNumber(data.maximo);
        if(!validateString(classe.descricao,3)){
            const message="Informe uma descrição de no mínimo 3 caracteres!"
            toast.error(message);
            setSending(false);
            return;
        }
        if (classe.id > 0) {
            api.put(`GrupoAdicional/UpdateGrupo`, classe)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`ingrediente atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar ingrediente. ${err.response?.data}`);
                })

        } else {
            classe.empresaId = user.empresaSelecionada;
            api.post(`GrupoAdicional/CreateGrupo`, classe)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`ingrediente cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar ingrediente. ${err.response?.data}`);
                })
        }
        setSending(false);
    }

    const removeItem = async (item: IGrupoAdicionalMateriaPrima) => {
        //ja ta na nuvem
        if(item.id > 0){
            setLoading(true);
            await api.delete(`/GrupoAdicionalMateriaPrima/Remove?id=${item.id}`)
            .then(() => {
                toast.success('Item Removido com sucesso!');
                var res = _.remove(classe.produtosAdicionais, p => p.id == item.id);
                setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
            }).catch((err) => {
                toast.error('Erro ao tentar remover item');
            })
            setLoading(false);
        }
        //nao ta na nuvem
        else{
            var res = _.remove(classe.produtosAdicionais, p => p.materiaPrimaId == item.materiaPrimaId);
            setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
            toast.success('Item Removido com sucesso!');
        }
    }
    const addItem = (item: IMateriaPrima, valor: number) => {
        if(!classe.produtosAdicionais){
            classe.produtosAdicionais = [];
        };
        var index  = _.findIndex(classe.produtosAdicionais, p => p.materiaPrimaId == item.id);
        if(index >= 0){
            toast.error('item ja adicionado ao grupo.');
            return;
        }
        classe.produtosAdicionais.push({
            idGrupoAdicional: classe.idGrupoAdicional,
            idGrupoAdicionalMateriaPrima: 0,
            id: 0,
            nome: item.nome,
            valor: valor,
            status: true,
            grupoAdicionalId: classe.id,
            grupoAdicional: undefined,
            materiaPrima: item,
            materiaPrimaId: item.id,
            idMateriaPrima: item.idMateriaPrima,
            empresaId: user.empresaSelecionada,
            lastChange: new Date(),
            localCriacao: 'NUVEM'
        });
        console.log(classe.produtosAdicionais)
        setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
        toast.success('Item adicionado com sucesso!');
    }

    const columns = [
        {
            name: '#',
            cell: (row: IGrupoAdicionalMateriaPrima) => <CustomButton onClick={() => { removeItem(row) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>,
            sortable: true,
            grow: 0
        },
        {
            name: 'Nome',
            selector: (row: IGrupoAdicionalMateriaPrima) => row.nome,
            sortable: true,
        },
        {
            name: 'Valor',
            selector: (row: IGrupoAdicionalMateriaPrima) => row.valor.toFixed(2),
            sortable: true,
            grow: 0
        },
    ]

    if(modalItem){
        return <VincularMateriaGrupo isOpen={modalItem} setClose={(materiaPrima, valor) => {
            if(materiaPrima){
                addItem(materiaPrima, valor)
            }
            setModalItem(false);
        }}/>
    }
    return (
        <BaseModal color={color} title={'Cadastro de grupo'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={classe.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <InputForm defaultValue={classe.descricao} width={'55%'} title={'Descrição'} errors={errors} inputName={"descricao"} register={register} />
                    <InputForm defaultValue={classe.minimo} width={'10%'} title={'Minimo'} errors={errors} inputName={"minimo"} register={register} />
                    <InputForm defaultValue={classe.maximo} width={'10%'} title={'Maximo'} errors={errors} inputName={"maximo"} register={register} />
                    <SelectStatus width={'10%'} selected={classe.status} setSelected={(v) => { setClasse({ ...classe, status: v }) }} />
                    <div className={styles.table}>
                        <CustomButton onClick={() => {setModalItem(true)}} typeButton={'main'}>Adicionar item</CustomButton>
                        <CustomTable
                            paginationPerPage={10}
                            columns={columns}
                            data={classe.produtosAdicionais || []}
                            loading={loading}
                        />
                    </div>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}