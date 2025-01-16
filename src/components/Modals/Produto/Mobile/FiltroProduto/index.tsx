import { useState } from "react";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import _ from "lodash";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import SelectStatus from "@/components/Selects/SelectStatus";
import BaseModal from "@/components/Modals/Base/Index";
import IClasseMaterial from "@/interfaces/IClasseMaterial";


interface props {
    isOpen: boolean
    setClose: (res?: any) => void
    color?: string
    empresaId?: number
    searchProps: searchProps
}
type searchProps = {
    classe?: IClasseMaterial
    status?: boolean
}
export default function FiltroProduto({empresaId, isOpen,  setClose, color, searchProps }: props) {

    const [search, setSearch] = useState<searchProps>(searchProps)

    return (
        <BaseModal height={'50vh'} width={'100%'} color={color} title={'Filtros'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <SelectClasseMaterial empresaId={empresaId} selected={(search?.classe?.id || 0)} setSelected={(v) => {setSearch({...search, classe: v})}}/>
                <SelectStatus  selected={search?.status} setSelected={(v) => {setSearch({...search, status: v})}}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(undefined); } } typeButton={"secondary"}>Limpar</CustomButton>
                        <CustomButton typeButton={'dark'} onClick={() => {setClose(search)}}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}