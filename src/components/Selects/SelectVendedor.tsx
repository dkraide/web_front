import { useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IProduto from "@/interfaces/IProduto";
import _ from 'lodash';
import { SelectBase } from "./SelectBase";

interface selProps {
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
}

export default function SelectProduto({ width, selected, setSelected }: selProps) {
    const [formas, setFormas] = useState<IProduto[]>([]);
    const { getUser } = useContext(AuthContext);
    const loadFormas = async () => {
        const res = await getUser();
        var ret = await api.get(`/Vendedor/List?EmpresaId=${res?.empresaSelecionada}&status=true`)
            .then(({ data }: AxiosResponse<IProduto[]>) => {
                setFormas(data);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao buscar produto ${err.message}`)
            });
    }
    useEffect(() => {
        loadFormas();
    }, []);
    function getData() {
        var data = [] as any[];
        formas.map((forma) => {
            var x = {
                value: forma.id.toString(),
                text: `${forma.cod.toString()} - ${forma.nome}` || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any) {
        var index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }
    return (
        <SelectBase width={width} datas={getData()} selected={selected.toString()} title={'Produto'} setSelected={setSelectedProd} />
    )
}