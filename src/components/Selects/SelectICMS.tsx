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

export  default function SelectICMS({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: '00 - Tributada Integralmente'
           }, {
            value: 20,
            nome: '20 - Com redução de base de cálculo'
           }, {
            value: 40,
            nome: '40 - Isenta'
           }, {
            value: 41,
            nome: '41 - Não Tributada'
           }, {
            value: 60,
            nome: '60 - ICMS cobrado anteriormente por substituição tributária'
           },{
            value: 90,
            nome: '90 - Outros'
           }, {
            value: 101,
            nome: '101 - Tributada pelo Simples Nacional com permissão de crédito'
           }, {
            value: 102,
            nome: '102 - Tributada pelo Simples Nacional sem permissão de crédito'
           }, {
            value: 300,
            nome: '300 - Imune'
           }, {
            value: 400,
            nome: '400 - Não tributada'
           }, {
            value: 500,
            nome: '500 - ICMS cobrado anteriormente por substituição tributária(substituído) ou por antecipação'
           }, {
            value: 900,
            nome: '900 - Outros'
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
                text: forma.nome || ''
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
        <SelectBase maxTitleSize={70} width={width} datas={getData()} selected={selected} title={title || 'ICMS'} setSelected={setSelectedProd}/>
    )
}