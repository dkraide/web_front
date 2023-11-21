import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import { SelectBase } from "./SelectBase";
import _ from "lodash";

interface selProps{
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
}

export  default function SelectClasseMaterial({width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IClasseMaterial[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           const res =  await getUser();
           api.get(`/ClasseMaterial/List?empresaId=${res?.empresaSelecionada}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar Grupo de Material ${err.message}`)
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
                text: forma.nomeClasse || ''
            }
            data.push(x);
        });
        return data;
    }

    function onSelect(value: any) {
        var index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }

    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Grupo'} setSelected={onSelect}/>
    )
}