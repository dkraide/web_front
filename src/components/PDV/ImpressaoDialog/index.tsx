import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import { useEffect } from "react";
import {  onFocus } from "@/utils/functions";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: boolean) => void
}
export default function ImpressaoDialog({ isOpen, setClose }: cancelarProps) {

    useEffect(() => {

        if(isOpen){
            onFocus("title");
        }

    }, [isOpen])



    return (
        <BaseModal color={'#d1ebf5'} width={'60%'} height={'70%'} title={'Impressao'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            <div className={styles.content}>
                <h3 onKeyDown={(e) => console.log(e)} id="title">Deseja imprimir o cupom ?</h3>
                <div className={styles.button}>
                    <CustomButton typeButton={'danger'} onClick={() => { setClose(undefined) }}>Cancelar</CustomButton>
                    <CustomButton typeButton={'success'} onClick={() => { setClose(true) }} >Imprimir</CustomButton>
                </div>

            </div>
        </BaseModal>
    )
}
