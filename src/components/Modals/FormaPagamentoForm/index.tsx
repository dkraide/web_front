import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import SelectStatus from "@/components/Selects/SelectStatus";
import BaseModal from "../Base/Index";
import IFormaPagamento from "@/interfaces/IFormaPagamento";
import SelectSimNao from "@/components/Selects/SelectSimNao";


interface props {
    isOpen: boolean
    classeId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function FormaPagamentoForm({user, isOpen, classeId, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [obj, setObj] = useState<IFormaPagamento>({} as IFormaPagamento)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (classeId > 0) {
            api.get(`/FormaPagamento/Select?id=${classeId}`)
                .then(({ data }: AxiosResponse<IFormaPagamento>) => {
                    setObj(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            obj.id = 0;
            obj.isVisivel = true;
            setObj(obj);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        obj.nome = data.nome;
        if(obj.id > 0){
            api.put(`FormaPagamento/UpdateForma`, obj)
            .then(({data}: AxiosResponse) => {
                toast.success(`Forma de Pagamento atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar Forma de Pagamento. ${err.response?.data}`);
            })

        }else{
            obj.empresaId = user.empresaSelecionada;
            api.post(`FormaPagamento/Create`, obj)
            .then(({data}: AxiosResponse) => {
                toast.success(`Forma de Pagamento cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar Forma de Pagamento. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal  color={color} title={'Cadastro de Forma de Pagamento'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={obj.id} width={'30%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <SelectStatus width={'25%'} selected={obj.isVisivel} setSelected={(v) => {setObj({...obj, isVisivel: v})}} />
                    <InputForm defaultValue={obj.nome} width={'75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <SelectSimNao title={'Gera Faturamento'} width={'25%'} selected={obj.geraFaturamento} setSelected={(v) => {setObj({...obj, geraFaturamento: v})}} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}