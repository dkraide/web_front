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
    empresaId?: number;
    ignore?: number[];
}

export  default function SelectMateriaPrima({width, selected, setSelected, empresaId, ignore}: selProps){
    const [formas, setFormas] = useState<IMateriaPrima[]>([]);
    const {getUser} = useContext(AuthContext);
    const loadFormas = async () => {
           let e = empresaId;
           if(!e){
           const res =  await getUser();
              e = res?.empresaSelecionada;
           }
           api.get(`/MateriaPrima/List?empresaId=${e}`)
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
      useEffect(() => {
       if(!ignore || ignore.length == 0){
        return;
       }
    }, [ignore]);
        function getData() {
            var data = [] as any[];
           // var isSelected = false;
            formas.map((forma, index) => {
                var ind = _.findIndex(ignore, p => p == forma.id);
               if(ind >= 0){
                return;
               }
            //    if(!isSelected && !selected){
            //       setSelected(forma);
            //       isSelected = true;
            //    }
                var x = {
                    value: forma.id.toString(),
                    label: `${forma.nome}` || ''
                }
                data.push(x);
            });
            return data;
        }
        function setSelectedProd(value: any) {
            var index = _.findIndex(formas, p => p.id == value);
            if (index >= 0) {
                setSelected(formas[index]);
            }
        }

    return(
        <SelectBase width={width} datas={getData()} selected={selected?.toString()} title={'Ingrediente'} setSelected={setSelectedProd}/>
    )
}