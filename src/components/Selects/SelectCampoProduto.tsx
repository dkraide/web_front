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

export  default function SelectCampoProduto({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: 'Valor Compra'
           }, {
            value: 1,
            nome: 'Valor Venda'
           }, {
            value: 2,
            nome: 'Quantidade Minima'
           }, {
            value: 3,
            nome: 'Multiplicador'
           }, {
            value: 4,
            nome: 'Status'
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
                setSelected(formas[index]);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected} title={title || 'Campo'} setSelected={setSelectedProd}/>
    )
}