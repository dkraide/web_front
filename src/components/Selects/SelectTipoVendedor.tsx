import {useEffect, useState } from "react";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any
    setSelected: (value: any) => void
    width?: string
    title?: string
}
interface IObj{
    value: number
    nome: string
}

export  default function SelectTipoVendedor({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: 'POR EMISSOR'
           }, {
            value: 1,
            nome: 'POR VENDEDOR'
           }];
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
                setSelected(formas[index].value == 1);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected ? '1' : '0'} title={title || 'Tipo Usuario'} setSelected={setSelectedProd}/>
    )
}