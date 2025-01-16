import { useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import {InputForm} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import _ from "lodash";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import SelectCampoProduto from "@/components/Selects/SelectCampoProduto";
import SelectStatus from "@/components/Selects/SelectStatus";


interface props {
    isOpen: boolean
    setClose: (res?: any) => void
    color?: string
    empresaId?: number
}
export default function AjusteEmMassa({empresaId, isOpen,  setClose, color }: props) {


    const [sending, setSending] = useState(false);
    const [classeId, setClasseId] = useState(0)
    const [campo, setCampo] = useState<any>();
    const [status, setStatus] = useState(true);

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


        const onSubmit = async (data: any) =>{
            if(classeId <= 0){
                toast.error(`Selecione uma classe de material`);
                return;
            }
            if(!campo || campo.nome?.length == 0){
                toast.error(`Selecione um campo`);
                return;
            }
            setSending(true);
             var field = campo.nome.replaceAll(' ', '').toUpperCase();
            
            var value = data.ajuste;
            if(field == "STATUS"){
                value = status.toString();
            }
            api.put(`/Produto/AjusteMassa?ClasseMaterialId=${classeId}&Campo=${field}&Valor=${value}`)
            .then(({data}: AxiosResponse) => {
                toast.success(`${data} ajustados com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao enviar Ajuste. ${err.response?.data || err.message}`);
            })
            setSending(false);
        }



    return (
        <BaseModal height={'50vh'} width={'100%'} color={color} title={'Ajuste em Masse'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <SelectClasseMaterial empresaId={empresaId} selected={(classeId || 0)} setSelected={(v) => {setClasseId(v.id)}}/>
                <SelectCampoProduto selected={campo?.value} setSelected={setCampo}/>
                {campo?.nome?.toUpperCase() == "STATUS" ? <>
                <SelectStatus title={'Campo'} selected={status} setSelected={setStatus} />
                </> : <>
                <InputForm placeholder={'Ajuste'}  width={'75%'} title={'Informe o Ajuste'} errors={errors} inputName={"ajuste"} register={register} />
                </>}
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}