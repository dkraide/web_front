import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IMotivoLancamento from "@/interfaces/IMotivoLancamento";

interface selProps{
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
}

export  default function SelectMotivoLancamento({width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IMotivoLancamento[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           const res =  await getUser();
           api.get(`/MotivoLancamento/List?empresaId=${res?.empresaSelecionada}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
                   if((!selected || selected == 0) && data.length > 0){
                       setSelected(data[0])
                   }
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
                label: forma.nome || ''
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
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Motivo'} setSelected={onSelect}/>
    )
}