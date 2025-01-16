import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import ICombo from "@/interfaces/ICombo";
import AddItem from "./AddItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import ITabelaPromocional from "@/interfaces/ITabelaPromocional";
import ITabelaPromocionalProduto from "@/interfaces/ITabelaPromocionalProduto";
import { fGetNumber , validateString , validateNumber} from "@/utils/functions";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function TabelaForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [item, setItem] = useState<ITabelaPromocional>({} as ITabelaPromocional)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [addItem, setAddItem] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/TabelaPromocional/Select?id=${id}`)
                .then(({ data }: AxiosResponse<ITabelaPromocional>) => {
                    setItem(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            item.id = 0;
            item.status = true;
            setItem(item);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        item.titulo = data.titulo;
        item.quantidadeMinima = fGetNumber(data.quantidadeMinima);
        if(
            !validateString(item.titulo,3)||
            !validateNumber(item.quantidadeMinima,1)
        ){
            const message=
            !validateString(item.titulo,3)?'Digite uma descrição de no mínimo 3 caracteres!':
            'Digite uma quantidade mínima!';
            toast.error(message);
            setSending(false);
            return;
        }
        if (item.id > 0) {
            api.put(`TabelaPromocional/UpdateTabela`, item)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Tabela atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Tabela. ${err.response?.data}`);
                })

        } else {
            item.empresaId = user.empresaSelecionada;
            api.post(`TabelaPromocional/Create`, item)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Tabela cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Tabela. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    async function remove(index) {
        if (item.produtos[index].id > 0) {
            var res = await api.delete(`/TabelaPromocionalProduto/Delete?id=${item.produtos[index].id}`).then((response) => {
                toast.success(`Item removido do banco de dados`);
                return true;
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao remover item do banco de dados`);
                return false;
            })
            if (!res) {
                return;

            }
        }
        item.produtos.splice(index, 1);
        setItem({ ...item, produtos: item.produtos });
    }
    return (
        <BaseModal height={'90vh'} width={'50%'} color={color} title={'Cadastro de Tabela Promocional'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={item.quantidadeMinima} width={'40%'} title={'Quantidade Minima'} errors={errors} inputName={"quantidadeMinima"} register={register} />
                    <SelectStatus width={'40%'} selected={item.status} setSelected={(v) => { setItem({ ...item, status: v }) }} />
                    <InputForm defaultValue={item.titulo} width={'100%'} title={'Descricao'} errors={errors} inputName={"titulo"} register={register} />
                    <div className={styles.itens}>
                        <CustomButton typeButton={'dark'} onClick={() => { setAddItem(true) }}>Adicionar Item</CustomButton>
                        <ul>
                            {(item.produtos && item.produtos.length > 0) && item.produtos.map((item, index) => {
                                return (
                                    <li key={index}>
                                        <CustomButton onClick={() => { remove(index) }} typeButton={'danger'}><FontAwesomeIcon icon={faTrash} /></CustomButton>
                                        <div>
                                            <b>{item.produto ? item.produto.nome :  '--'}</b>
                                            <b>R$ {item.valorUnitario.toFixed(2)}</b>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
            {addItem && <AddItem user={user} isOpen={addItem} setClose={(produtos: ITabelaPromocionalProduto[]) => {
                if (produtos) {
                    if (!item.produtos) {
                        item.produtos = [];
                    }
                    produtos.map((v) => {
                        v.tabelaPromocionalId = item.id;
                        v.idTabelaPromocional = item.iDTabelaPromocional;
                        item.produtos.push(v);
                     })
                    setItem({ ...item, produtos: item.produtos});
                }
                setAddItem(false);
            }} />}
        </BaseModal>
    )
}