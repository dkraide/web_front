import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IEmpresa from "@/interfaces/IEmpresa";

interface selProps{
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
    isContador?: boolean
}

export  default function SelectEmpresa({isContador, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IEmpresa[]>([]);
    const loadFormas = async () => {
           api.get(`/Empresa/Getempresas?isContador=${isContador || false}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar empresas ${err.message}`)
           });
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            var x = {
                value: forma.id.toString(),
                label: forma.nomeFantasia || ''
            }
            data.push(x);
        });
        return data;
    }

    function onSelect(value: any) {
        var index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index].id);
        }
    }

    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Empresa'} setSelected={onSelect}/>
    )
}