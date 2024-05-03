import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import { SelectBase } from "./SelectBase";
import _ from "lodash";
import IFormaPagamento from "@/interfaces/IFormaPagamento";

interface selProps{
    selected: number;
    setSelected: (value: IFormaPagamento) => void;
    width?: string;
    empresaId?: number
}

export  default function SelectFormaPagamento({empresaId, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IFormaPagamento[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           const res =  await getUser();
           api.get(`/FormaPagamento/List?EmpresaId=${empresaId || res?.empresaSelecionada}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
           })
           .catch((err: AxiosError) => {
               toast.error(`Erro ao buscar Formas de Pagamento ${err.message}`)
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
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Forma'} setSelected={onSelect}/>
    )
}