import {useEffect, useState } from "react";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any
    setSelected: (value: string) => void
    width?: string
    title?: string
}
interface IObj{
    value: string
    nome: string
}
export  default function SelectTipoDespesa({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 'DESPESA FIXA',
            nome: 'DESPESA FIXA'
           }, {
            value: 'DESPESA VARIAVEL',
            nome: 'DESPESA VARIAVEL'
           }, {
            value: 'TAXAS E TRIBUTOS',
            nome: 'TAXAS E TRIBUTOS'
           }
           , {
            value: 'OUTROS',
            nome: 'OUTROS'
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
                setSelected(formas[index].value);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={selected} title={title || 'Tipo'} setSelected={setSelectedProd}/>
    )
}