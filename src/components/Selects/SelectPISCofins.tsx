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

export  default function SelectPISCofins({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 1,
            nome: '01 - Operação Tributável(base de cálculo = valor da operação alíquota normal(cumulativo / não cumulativo))'
           },{
            value: 2,
            nome: '02 - Operação Tributávl(base de cálculo = valor da operação(alíquota diferenciada))'
           },{
            value: 3,
            nome: '03 - Operação Tributável(base de cálculo = quantidade vendida x alíquota por unidade de produto)'
           },{
            value: 4,
            nome: '04 - Operação Tributável(tributação monofásica(alíquota zero))'
           },{
            value: 5,
            nome: '05 - Operação Tributável por Substituição não tributária'
           },{
            value: 6,
            nome: '06 - Operação Tributável(alíquota zero)'
           },{
            value: 7,
            nome: '07 - Operação Isenta de Contribuição'
           },{
            value: 8,
            nome: '08 - Operação Sem Incidência de Contribuição'
           },{
            value: 9,
            nome: '09 - Operação com Suspensão da Contribuição'
           },{
            value: 49,
            nome: '49 - Outras Operações de Saída'
           },{
            value: 99,
            nome: '99 - Outras Operações'
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
        <SelectBase maxTitleSize={60} width={width} datas={getData()} selected={selected} title={title || 'PIS/COFINS'} setSelected={setSelectedProd}/>
    )
}