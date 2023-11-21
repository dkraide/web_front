import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IMateriaPrima from "@/interfaces/IMateriaPrima";

interface selProps{
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
}

export  default function SelectMateriaPrima({width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IMateriaPrima[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           const res =  await getUser();
           api.get(`/MateriaPrima/List?empresaId=${res?.empresaSelecionada}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar lista de  Materia Prima ${err.message}`)
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
                text: forma.nome || ''
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
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Materia Prima'} setSelected={onSelect}/>
    )
}