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
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import SelectMateriaPrima from "@/components/Selects/SelectMateriaPrima";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import { fGetNumber } from "@/utils/functions";


interface props {
    isOpen: boolean
    setClose: (res?: any) => void
    color?: string
    user: IUsuario
}
export default function VinculeMateriaPrima({user, isOpen, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();

    const [mp, setMp] = useState<IMateriaPrima>()
    const [opcional, setOpcional] = useState(true);
    const onSubmit = async (data: any) =>{
        if(!mp || !mp.id || mp.id == 0){
            toast.error(`Selecione uma materia prima`);
        }
        var qntd = fGetNumber(getValues("quantidade"));
        var obj = {
            qntd,
            mp,
            opcional
        };
        setClose(obj);
    }
    return (
        <BaseModal height={'30%'} width={'50%'} color={color} title={'Vincular Materia Prima'} isOpen={isOpen} setClose={setClose}>
              <div className={styles.container}>
                <SelectMateriaPrima selected={mp?.id} setSelected={setMp}/>
                <SelectSimNao width={'40%'} selected={opcional} setSelected={setOpcional} title={'Opcional?'}/>
                <InputForm width={'40%'} register={register} inputName={'quantidade'} title={'Quantidade'} errors={errors}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}