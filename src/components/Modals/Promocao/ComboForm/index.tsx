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
import IPromocao from "@/interfaces/IPromocao";
import SelectClasseProduto from "@/components/Selects/SelectClasseProduto";
import SelectProduto from "@/components/Selects/SelectProduto";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import { fGetNumber } from "@/utils/functions";
import ICombo from "@/interfaces/ICombo";
import AddItem from "./AddItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function ComboForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [item, setItem] = useState<ICombo>({} as ICombo)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [addItem, setAddItem] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Combo/Select?id=${id}`)
                .then(({ data }: AxiosResponse<ICombo>) => {
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
            item.empresaId = user.empresaSelecionada;
            setItem(item);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        item.codigo = data.codigo;
        item.descricao = data.descricao;
        if (item.id > 0) {
            api.put(`Combo/UpdateCombo`, item)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Combo atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Combo. ${err.response?.data}`);
                })

        } else {
            item.empresaId = user.empresaSelecionada;
            api.post(`Combo/Create`, item)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Combo cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Combo. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    async function remove(index) {
        if (item.itens[index].id > 0) {
            var res = await api.delete(`/ComboItem/Delete?id=${item.itens[index].id}`).then((response) => {
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
        item.itens.splice(index, 1);
        setItem({ ...item, itens: item.itens });
    }
    if(addItem){
        return <AddItem isOpen={addItem} setClose={(v) => {
            if (v) {
                if (!item.itens) {
                    item.itens = [];
                }
                v.comboId = item.id;
                v.idCombo = item.idCombo;
                v.empresaId = user.empresaSelecionada;
                item.itens.push(v);
                setItem({ ...item, itens: item.itens });
            }
            setAddItem(false);
        }} />
    }
    return (
        <BaseModal height={'80%'} width={'50%'} color={color} title={'Cadastro de Combo'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={item.codigo} width={'40%'} title={'Codigo'} errors={errors} inputName={"codigo"} register={register} />
                    <SelectStatus width={'40%'} selected={item.status} setSelected={(v) => { setItem({ ...item, status: v }) }} />
                    <InputForm defaultValue={item.descricao} width={'100%'} title={'Descricao'} errors={errors} inputName={"descricao"} register={register} />
                    <div className={styles.itens}>
                        <CustomButton typeButton={'dark'} onClick={() => { setAddItem(true) }}>Adicionar Item</CustomButton>
                        <ul>
                            {(item.itens && item.itens.length > 0) && item.itens.map((comboItem, index) => {
                                return (
                                    <li key={index}>
                                        <CustomButton onClick={() => { remove(index) }} typeButton={'danger'}><FontAwesomeIcon icon={faTrash} /></CustomButton>
                                        <div>
                                            <b>{comboItem.produto ? comboItem.produto.nome : comboItem.classeMaterial ? comboItem.classeMaterial.nomeClasse : '--'}</b>
                                            <b>{comboItem.quantidade.toFixed(2)}</b>
                                            <b>R$ {comboItem.valorUnitario.toFixed(2)}</b>
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
        </BaseModal>
    )
}