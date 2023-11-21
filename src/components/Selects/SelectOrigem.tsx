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

export  default function SelectOrigem({title, width, selected, setSelected}: selProps){
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
           var res = [{
            value: 0,
            nome: '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8'
           },{
            value: 1,
            nome: '1 - Estrangeira - Importação direta, exceto a indicada no código 6'
           },{
            value: 2,
            nome: '2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7'
           },{
            value: 3,
            nome: '3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% (quarenta por cento) e inferior ou igual a 70% (setenta por cento)'
           },{
            value: 4,
            nome: '4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos de que tratam as legislações citadas nos Ajustes'
           },{
            value: 5,
            nome: '5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%'
           },{
            value: 6,
            nome: '6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX'
           },{
            value: 7,
            nome: '7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX'
           },{
            value: 8,
            nome: '8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70% (setenta por cento)'
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
        <SelectBase maxTitleSize={60} width={width} datas={getData()} selected={selected} title={title || 'Origem'} setSelected={setSelectedProd}/>
    )
}