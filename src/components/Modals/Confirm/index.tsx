import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
import styles from "./styles.module.scss";

interface cancelarProps {
    isOpen: boolean,
    message: string
    setClose: (res: boolean) => void
}
export default function Confirm({ isOpen, message, setClose}: cancelarProps) {
    return (
        <BaseModal width={'50%'} height={'30%'} title={'Confirmar'} isOpen={isOpen} setClose={() => {setClose(false)}}>
            <div className={styles.content}>
            <h3>{message}</h3>
            <div className={styles.button}>
                <CustomButton typeButton={'danger'} onClick={() => {setClose(false)}}>Cancelar</CustomButton>
                <CustomButton typeButton={'success'} onClick={() => {setClose(true)}} >Confirmar</CustomButton>
            </div>
            </div>
        </BaseModal>
    )
}
