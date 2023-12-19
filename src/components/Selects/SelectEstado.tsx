import {useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import _ from 'lodash';
import { apiIbge } from "@/services/apiIBGE";
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any;
    setSelected: (value: any) => void;
    width?: string;
}
interface IEstado{
    id: number
    sigla: string
    nome: string

}

export  default function SelectProduto({width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IEstado[]>([]);
    const loadFormas = async () => {
           apiIbge.get(`/estados`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar produto ${err.message}`)
           });
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            var x = {
                value: forma.sigla,
                label: forma.nome || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any){
           var index = _.findIndex(formas, p => p.sigla == value);
           if(index  >= 0){
                setSelected(formas[index]);
                
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Estado'} setSelected={setSelectedProd}/>
    )
}