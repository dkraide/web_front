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


interface props {
    isOpen: boolean
    classeId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function ClasseForm({user, isOpen, classeId, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [classe, setClasse] = useState<IClasseMaterial>({} as IClasseMaterial)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (classeId > 0) {
            api.get(`/ClasseMaterial/Select?id=${classeId}`)
                .then(({ data }: AxiosResponse<IClasseMaterial>) => {
                    setClasse(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            classe.id = 0;
            classe.status = true;
            setClasse(classe);
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        classe.nomeClasse = data.nomeClasse;
        if(classe.id > 0){
            api.put(`ClasseMaterial/Update`, classe)
            .then(({data}: AxiosResponse) => {
                toast.success(`grupo atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
            })

        }else{
            classe.empresaId = user.empresaSelecionada;
            api.post(`ClasseMaterial/Create`, classe)
            .then(({data}: AxiosResponse) => {
                toast.success(`grupo cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar grupo. ${err.response?.data}`);
            })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'30%'} width={'50%'} color={color} title={'Cadastro de grupo'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={classe.id} width={'10%'} title={'Cod'} readOnly={true} errors={errors} inputName={"id"} register={register} />
                    <InputForm defaultValue={classe.nomeClasse} width={'75%'} title={'Nome'} errors={errors} inputName={"nomeClasse"} register={register} />
                    <SelectStatus width={'15%'} selected={classe.status} setSelected={(v) => {setClasse({...classe, status: v})}} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}