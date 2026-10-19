import {useEffect, useState } from "react";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps{
    selected: any
    setSelected: (value: any) => void
    width?: string
    title?: string
    /** Adiciona a opção "GERAL"; `selected` undefined = geral e setSelected(undefined) ao escolhê-la. */
    allowAll?: boolean
}
interface IObj{
    value: number
    nome: string
}

export  default function SelectStatus({title, width, selected, setSelected, allowAll}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: 'Inativo'
           }, {
            value: 1,
            nome: 'Ativo'
           }];
           setFormas(res);
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = (allowAll ? [{ value: '-1', label: 'GERAL' }] : []) as any[];
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
           if (allowAll && value == -1) {
                setSelected(undefined);
                return;
           }
           var index = _.findIndex(formas, p => p.value == value);
           if(index  >= 0){
                setSelected(formas[index].value == 1);
           }
    }
    return(
        <SelectBase width={width} datas={getData()} selected={allowAll && selected === undefined ? '-1' : selected ? '1' : '0'} title={title || 'Status'} setSelected={setSelectedProd}/>
    )
}