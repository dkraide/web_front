import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import LoadingModal from "@/components/Modals/LoadingModal";
import { format } from "date-fns";
import _ from "lodash";
import CustomTable from "@/components/ui/CustomTable";
import ISangriaReforco from "@/interfaces/ISangriaReforco";
import SangriaForm from "./SangriaForm";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: boolean) => void
    caixa?: IMovimentoCaixa
    usuario: IUsuarioCaixa
}
export default function Sangrias({usuario, caixa, isOpen, setClose }: cancelarProps) {
    const {
        register,
        formState: { errors } } =
        useForm();

    const [loading, setLoading] = useState(false);
    const [sangrias, setSangrias] = useState([]);
    const [novaSangria, setNovaSangria] = useState(false);

    const loadData = async () => {
        setLoading(true);
        await api.get(`/MovimentoCaixa/Sangrias?MovimentoCaixaId=${caixa.id}`)
        .then(({data}: AxiosResponse) => {
            setSangrias(data);
        })
        .catch((err: AxiosError) => {
            toast.error(`Erro ao carregar sangrias`);
        })
        setLoading(false);

    }
    useEffect(()  => {
        if(isOpen && caixa.id != undefined){
            loadData();
        }
    }, [isOpen])

   if(loading){
    return  <LoadingModal isOpen={loading} setClose={() => { }} />
   }
   if(novaSangria){
    return <SangriaForm usuario={usuario} caixa={caixa} isOpen={novaSangria} setClose={(v) => {
        if(v){
            loadData();
        }
        setNovaSangria(false);
    }}/>
   }

   const columns = [
    {
        name: 'Data',
        cell: ({dataSangria }: ISangriaReforco) => <p>{format(new Date(dataSangria.toString()), 'dd/MM/yyyy HH:mm')}</p>,
        selector: row => row.dataVenda,
        sortable: true,
        width: '20%',
    },
    {
        name: 'Usuario',
        selector: (row: ISangriaReforco) => row.nomeUsuario || '--',
        sortable: true,
        width: '20%',
    },
    {
        name: 'Observacao',
        selector: (row: ISangriaReforco) => row.motivo || '--',
        sortable: true,
        width: '40%',
    },
    {
        name: 'Tipo',
        selector: (row: ISangriaReforco) => row.isSangria ? 'SANGRIA' : 'ENTRADA',
        sortable: true,
        width: '10%',
    },
    {
        name: 'Valor',
        selector: (row: ISangriaReforco) => `R$ ${row.valorMovimento.toFixed(2)}`,
        sortable: true,
        width: '10%',
    }
]
    return (
        <BaseModal headerOff={!caixa} width={'100%'} height={'50%'} title={'Sangrias'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            <div className={styles.content}>
                <CustomButton typeButton={'dark'} onClick={() => {setNovaSangria(true)}}>Nova Sangria</CustomButton>
                <CustomTable
                  pagination data={sangrias} columns={columns}/>
            </div>
        </BaseModal>
    )
}



