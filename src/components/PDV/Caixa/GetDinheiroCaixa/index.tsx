import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { fGetNumber } from "@/utils/functions";
import { toast } from "react-toastify";

interface cancelarProps {
    isOpen: boolean
    setClose: (res?: number) => void
}
export default function GetDinheiroCaixa({isOpen,  setClose}: cancelarProps) {
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


        const onSubmit =  (data: any) => {
            var v1 = fGetNumber(data.valor1);
            var v2 = fGetNumber(data.valor2);
            if(v1 != v2){
                toast.error('Os valores nao conferem.');
                return;
            }
            setClose(v1);
        }


        
    return (
        <BaseModal width={'50%'} height={'50%'} title={'Informe o Dinheiro da Gaveta'} isOpen={isOpen} setClose={() => {setClose(undefined)}}>
            <div className={styles.content}>
            <InputForm  autoComplete={'off'} id="abertura" width={'50%'} title={'Abertura'} register={register} errors={errors} inputName={'valor1'} />
            <InputForm  autoComplete={'off'} id="confirme" width={'50%'} title={'Confirme'} register={register} errors={errors} inputName={'valor2'} />
            <div className={styles.button}>
                    <CustomButton typeButton={'danger'} onClick={() => { setClose(undefined) }}>Cancelar</CustomButton>
                    <CustomButton typeButton={'success'}onClick={() => { handleSubmit(onSubmit)() }} >Confirmar</CustomButton>
                </div>
            </div>
        </BaseModal>
    )
}
