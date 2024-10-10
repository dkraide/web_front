import {  useState } from "react";
import {  InputGroup } from "@/components/ui/InputGroup";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { fGetNumber } from "@/utils/functions";
import BaseModal from "@/components/Modals/Base/Index";
import SelectMateriaPrima from "@/components/Selects/SelectMateriaPrima";


interface props {
    isOpen: boolean
    setClose: (materiaPrima?: IMateriaPrima, valor?: number) => void
}
export default function VincularMateriaGrupo({ isOpen, setClose }: props) {

    const [materiaPrima, setMateriaPrima] = useState<IMateriaPrima>()
    const [valor, setValor] = useState('');

    const handleSubmit = async () => {

        if (!materiaPrima || !materiaPrima.id) {
            toast.error(`Selecione uma materia prima`);
            return;
        }
        var v = fGetNumber(valor);
        setClose(materiaPrima, v);
    }
    return (
        <BaseModal height={'50vh'} title={'Vincular ingrediente ao grupo'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <SelectMateriaPrima width={'75%'} selected={materiaPrima?.id || 0} setSelected={setMateriaPrima}/>
                <InputGroup width={'20%'} title={'Valor'} value={valor} onChange={(v) => {setValor(v.currentTarget.value)}}/>
                <div className={styles.button}>
                    <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} onClick={() => { handleSubmit() }}>Confirmar</CustomButton>
                </div>
            </div>
        </BaseModal>
    )
}