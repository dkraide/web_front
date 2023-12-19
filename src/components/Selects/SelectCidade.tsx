import {useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import _ from 'lodash';
import { apiIbge } from "@/services/apiIBGE";
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any;
    setSelected: (value: any) => void;
    uf?: string
    width?: string;
}
interface IMunicipio{
    id: number
    nome: string
}

export  default function SelectCidade({uf, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IMunicipio[]>([]);
    const loadFormas = async () => {
           apiIbge.get(`/estados/${uf}/municipios`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar municipios ${err.message}`)
           });
    }
    useEffect(() => {
        loadFormas();
    }, [uf]);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            var x = {
                value: forma.id,
                label: forma.nome || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any){
           var index = _.findIndex(formas, p => p.id == value);
           if(index  >= 0){
                setSelected(formas[index]);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Municipio'} setSelected={setSelectedProd}/>
    )
}