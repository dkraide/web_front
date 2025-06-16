import {useEffect, useState } from "react";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any
    setSelected: (value: any) => void
    width?: string
    title?: string
    min?: number
    max?: number
}
interface IObj{
    value: number
    nome: string
}

export  default function SelectAno({title, width, selected, setSelected, min, max}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
        if(!min){
            min = 2020;
        }
        if(!max){
            max = new Date().getFullYear();
        }
        var res = []
        for(let i = min; i <= max; i++){
             res.push({
                value: i,
                nome: i.toString()
             });
        }
           setFormas(res);
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            var x = {
                value: forma.value.toString(),
                label: forma.nome || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any){
           var index = _.findIndex(formas, p => p.value == value);
           if(index  >= 0){
                setSelected(formas[index].value);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected} title={title || 'Selecione o Ano'} setSelected={setSelectedProd}/>
    )
}