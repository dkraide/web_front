import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import {  AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Modals/Base/Index";
import _ from "lodash";
import IVenda from "@/interfaces/IVenda";
import { Spinner } from "react-bootstrap";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
}
type result = {
    html: string
    result: boolean
    error: string
}
export default function GerarNFCe({isOpen, id, setClose, color }: props) {


    const [title, setTitle] = useState('Carregando...');

    useEffect(() => {
        init(id);
    }, []);

    async function init(id: number){

        setTitle('Gerando nota fiscal...');
        setTimeout(() => {}, 300)
        var res = await api.post(`/PDV/GerarValidar?vendaid=${id}`)
        .then(({data}: AxiosResponse<result>) => {
            if(!data.result){
                toast.error(`Erro ao gerar nota fiscal. ${data.error}`);
                setClose(false);
                return false;
            }
            return true;
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao gerar nota fiscal. ${err.response?.data || err.message}`);
            setClose(false);
            return false;
        });

        if(!res){
            return;
        }

        setTitle('Transmitindo nota fiscal...');
        setTimeout(() => {}, 300)
        res = await api.post(`/PDV/Transmitir?vendaid=${id}`)
        .then(({data}: AxiosResponse<result>) => {
            if(!data.result){
                toast.error(`Erro ao transmitir nota fiscal. ${data.error}`);
                return false;
            }
            toast.success(`Nota Fiscal gerada com sucesso!`);
            return true;

        }).catch((err: AxiosError) => {
            toast.error(`Erro ao transmitir nota fiscal. ${err.response?.data || err.message}`);
            return false;
        })
        setClose(res);
    }
    return (
        <BaseModal headerOff={true}  height={'100%'} width={'100%'} color={color} title={'Gerar NFC-e'} isOpen={isOpen} setClose={setClose}>
                <div className={styles.container}>
                    <div><Spinner style={{width: '100px', height: '100px'}} size={'sm'}/></div>
                    <b style={{height: '50px', width: '100%', textAlign: 'center'}}>{title}</b>
                </div>
        </BaseModal>
    )
}