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

export  default function SelectDiaSemana({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: 'Todos'
           }, {
            value: 1,
            nome: 'Domingo'
           }, {
            value: 2,
            nome: 'Segunda-Feira'
           }, {
            value: 3,
            nome: 'Terca-Feira'
           }, {
            value: 4,
            nome: 'Quarta-Feira'
           }, {
            value: 5,
            nome: 'Quinta-Feira'
           }, {
            value: 6,
            nome: 'Sexta-Feira'
           }, {
            value: 7,
            nome: 'Sabado'
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
        <SelectBase width={width} datas={getData()} selected={selected} title={title || 'Dia'} setSelected={setSelectedProd}/>
    )
}