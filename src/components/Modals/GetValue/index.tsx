import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm, InputGroup} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";


interface props {
    isOpen: boolean
    setClose: (res?: boolean) => void
    color?: string
    onConfirm: (res: string) => void
    title: string
    defaultValue?: string
}
export default function GetValue({defaultValue, title, isOpen, onConfirm, setClose, color }: props) {

    const [value, setValue] = useState(defaultValue || '');
    return (
        <BaseModal height={'30%'} width={'30%'} color={color} title={'Informe o valor'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                    <InputGroup title={title} value={value} onChange={(e) => {setValue(e.target.value)}}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'}onClick={() => {onConfirm(value)}}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}