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
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque";
import CustomTable from "@/components/ui/CustomTable";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SelectProduto from "@/components/Selects/SelectProduto";
import IProduto from "@/interfaces/IProduto";
import { format } from "date-fns";
import SelectEntradaSaida from "@/components/Selects/SelectEntradaSaida";
import { fGetNumber } from "@/utils/functions";
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto";
import _ from "lodash";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";


interface props {
    isOpen: boolean
    setClose: (res?: IClasseMaterial) => void
    color?: string
    empresaId?: number
    selectedId?: number
}
export default function SelectClasseModal({selectedId, empresaId, isOpen,  setClose, color }: props) {


    const [prod, setProd] = useState<IClasseMaterial>();
    return (
        <BaseModal height={'50vh'} width={'100%'} color={color} title={'Selecionar Classe Material'} isOpen={isOpen} setClose={setClose}>
            <div className={styles.container}>
                <SelectClasseMaterial empresaId={empresaId} selected={prod?.id || (selectedId|| 0)} setSelected={setProd}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'}  onClick={() => {
                            if(!prod){
                                toast.error(`Selecione um produto!`);
                                return;
                            }
                            setClose(prod);
                        }}>Confirmar</CustomButton>
                    </div>
                </div>
        </BaseModal>
    )
}