import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm} from "@/components/ui/InputGroup";
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


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function AtacadoForm({user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [item, setItem] = useState<IPromocao>({} as IPromocao)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [isProduto, setIsProduto] = useState(true);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Promocao/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IPromocao>) => {
                    setItem(data);
                    if(data.classeMaterialId > 0){
                        setIsProduto(false);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            item.id = 0;
            item.status = true;
            setItem(item);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        item.quantidade = fGetNumber(data.quantidade);
        item.valorFinal = fGetNumber(data.valorFinal);
        if(item.id > 0){
            api.put(`Promocao/UpdatePromocao`, item)
            .then(({data}: AxiosResponse) => {
                toast.success(`Promocao atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar Promocao. ${err.response?.data}`);
            })

        }else{
            item.empresaId = user.empresaSelecionada;
            api.post(`Promocao/Create`, item)
            .then(({data}: AxiosResponse) => {
                toast.success(`Promocao cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar Promocao. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'80%'} width={'50%'} color={color} title={'Cadastro de Promocao'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <SelectClasseProduto title={'Tipo'} width={'60%'} selected={isProduto} setSelected={(v) => setIsProduto(v)}/>
                    <SelectStatus width={'30%'} selected={item.status} setSelected={(v) => {setItem({...item, status: v})}} />
                    {isProduto ? 
                    <SelectProduto empresaId={user.empresaSelecionada}  selected={item.produtoId || 0} setSelected={(v) => {
                        setItem({...item, produtoId: v.id, idProduto: v.idProduto, classeMaterialId: 0, idClasseMaterial: 0})
                    }}/> : 
                    <SelectClasseMaterial selected={item.classeMaterialId || 0} setSelected={(v) => {
                        setItem({...item, produtoId: 0, idProduto: 0, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial})
                    }}/>}
                    <InputForm defaultValue={item.quantidade} width={'50%'} title={'Quantidade'}  errors={errors} inputName={"quantidade"} register={register} />
                    <InputForm defaultValue={item.valorFinal} width={'50%'} title={'Valor Final'}  errors={errors} inputName={"valorFinal"} register={register} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}