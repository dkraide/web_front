import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectProduto from "@/components/Selects/SelectProduto";
import _ from "lodash";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import SelectMateriaPrima from "@/components/Selects/SelectMateriaPrima";


interface props {
    isOpen: boolean
    setClose: (res?: IMateriaPrima) => void
    color?: string
    empresaId?: number
    selectedId?: number
}
export default function SelectIngredienteModal({selectedId, empresaId, isOpen,  setClose, color }: props) {
    const [prod, setProd] = useState<IMateriaPrima>();
    return (
        <BaseModal height={'50vh'} width={'100%'} color={color} title={'Selecionar Ingrediente'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <SelectMateriaPrima empresaId={empresaId} selected={prod?.id || (selectedId|| 0)} setSelected={(setProd)}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'}  onClick={() => {
                            if(!prod){
                                toast.error(`Selecione um ingrediente!`);
                                return;
                            }
                            setClose(prod);
                        }}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}