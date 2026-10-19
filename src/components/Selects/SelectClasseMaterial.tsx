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
    setSelected: (value?: IClasseMaterial) => void;
    width?: string;
    empresaId?: number
    error?: string
    /** Adiciona a opção "GERAL" (id 0) e não auto-seleciona o primeiro item. */
    allowAll?: boolean
}

export  default function SelectClasseMaterial({empresaId, width, selected, setSelected, error, allowAll}: selProps){
    const [formas, setFormas] = useState<IClasseMaterial[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           const res =  await getUser();
           api.get(`/ClasseMaterial/List?EmpresaId=${empresaId || res?.empresaSelecionada}`)
           .then(({data}: AxiosResponse) => {
                   setFormas(data);
                   if (!allowAll && !selected && data.length > 0) {
                       setSelected(data[0]);
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
        var data = (allowAll ? [{ value: '0', label: 'GERAL' }] : []) as any[];
        formas.map((forma) => {
            var x = {
                value: forma.id.toString(),
                label: forma.nomeClasse || ''
            }
            data.push(x);
        });
        return data;
    }

    function onSelect(value: any) {
        if (allowAll && value == 0) {
            setSelected({ id: 0, nomeClasse: 'GERAL' } as IClasseMaterial);
            return;
        }
        var index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }

    return(
        <SelectBase error={error} width={width} datas={getData()} selected={selected?.toString()} title={'Grupo'} setSelected={onSelect}/>
    )
}