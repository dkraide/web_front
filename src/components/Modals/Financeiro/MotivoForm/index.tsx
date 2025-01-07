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
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import IMotivoLancamento from "@/interfaces/IMotivoLancamento";
import { validateString } from "@/utils/functions";
import { isMobile } from "react-device-detect";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function MotivoForm({user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IMotivoLancamento>({} as IMotivoLancamento)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/MotivoLancamento/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IMotivoLancamento>) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            objeto.id = 0;
            setObjeto(objeto);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        objeto.nome = data.nome;
        if(!validateString(objeto.nome,3)){
            toast.error("Digite um motivo de no mínimo 3 caracteres!");
            setSending(false);
            return;
        }
        if(objeto.id > 0){
            api.put(`MotivoLancamento/Update`, objeto)
            .then(({data}: AxiosResponse) => {
                toast.success(`Motivo atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar Motivo. ${err.response?.data}`);
            })
        }else{
            objeto.empresaId = user.empresaSelecionada;
            api.post(`MotivoLancamento/Create`, objeto)
            .then(({data}: AxiosResponse) => {
                toast.success(`Motivo cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar Motivo. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'30%'} width={'50%'} color={color} title={'Cadastro de Motivo'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={objeto.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <InputForm defaultValue={objeto.nome} width={isMobile ? '100%' : '75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}