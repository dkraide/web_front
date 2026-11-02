import { useEffect, useState } from "react";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps {
    selected: any
    setSelected: (value: any) => void
    width?: string
    title?: string
}
interface IObj {
    value: string
    nome: string
}

export default function SelectServiceType({ title, width, selected, setSelected }: selProps) {
    const [formas, setFormas] = useState<IObj[]>([]);
    const loadFormas = async () => {
        let res = [{
            value: 'DELIVERY',
            nome: 'Para Entregar'
        }, {
            value: 'TAKEOUT',
            nome: 'Para Retirar'
        }, {
            value: 'INDOOR',
            nome: 'Consumir no Local'
        }];
        setFormas(res);
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        let data = [] as any[];
        formas.map((forma) => {
            let x = {
                value: forma.value,
                label: forma.nome || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any) {
        let index = _.findIndex(formas, p => p.value == value);
        if (index >= 0) {
            setSelected(formas[index].value);
        }
    }
    return (
        <SelectBase width={width} datas={getData()} selected={selected} title={title || 'Tipo Serviço'} setSelected={setSelectedProd} />
    )
}