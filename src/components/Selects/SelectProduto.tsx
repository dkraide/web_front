import { SelectHTMLAttributes, forwardRef, useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IProduto from "@/interfaces/IProduto";
import _ from 'lodash';
import { SelectBase, SelectBaseRef } from "./SelectBase";
import { SelectInstance } from "react-select";

interface selProps {
    selected: number;
    setSelected: (value: any) => void;
    width?: string;
    ignore?: number[];
    id?: string
    empresaId?: number
    onKeyDown?: (e) => void
    includeInativos?: boolean
}


export  const  SelectProdutoRef = forwardRef<SelectInstance<any>, selProps>(function MyInput(props, ref) {
    const {selected, setSelected, width, ignore, id, onKeyDown} = props;
    const [formas, setFormas] = useState<IProduto[]>([]);
    const { getUser } = useContext(AuthContext);
    const loadFormas = async () => {
        const res = await getUser();
        var ret = await api.get(`/Produto/List?EmpresaId=${res?.empresaSelecionada}&status=true`)
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
    useEffect(() => {
       if(!ignore || ignore.length == 0){
        return;
       }
    }, [ignore]);
    function getData() {
        var data = [] as any[];
        formas.map((forma, index) => {
            var ind = _.findIndex(ignore, p => p == forma.id);
           if(ind >= 0){
            return;
           }
            var x = {
                value: forma.id.toString(),
                label: `${forma.cod.toString()} - ${forma.nome}` || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any) {
        var index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
            console.log(formas[index]);
        }
    }
    return (
        <SelectBaseRef onKeyDown={onKeyDown} ref={ref} id={id} width={width} datas={getData()} selected={selected.toString()} title={'Produto'} setSelected={setSelectedProd} />
    )
  });

export default function SelectProduto({includeInativos, empresaId, id,ignore, width, selected, setSelected }: selProps) {
    const [formas, setFormas] = useState<IProduto[]>([]);
    const { getUser } = useContext(AuthContext);
    const loadFormas = async () => {
        var res = 0;
        if(empresaId){
            res =  empresaId;
        }else{
            var user  = await getUser();
            res = user.empresaSelecionada;
        }
        var ret = await api.get(`/Produto/List?EmpresaId=${res}${includeInativos ? '' : '&status=true'}`)
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
    useEffect(() => {
       if(!ignore || ignore.length == 0){
        return;
       }
    }, [ignore]);
    function getData() {
        var data = [] as any[];
        var isSelected = false;
        formas.map((forma, index) => {
            var ind = _.findIndex(ignore, p => p == forma.id);
           if(ind >= 0){
            return;
           }
           if(!isSelected && !selected){
              setSelected(forma);
              isSelected = true;
           }
            var x = {
                value: forma.id.toString(),
                label: `${forma.cod.toString()} - ${forma.nome}` || ''
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
        <SelectBase   id={id} width={width} datas={getData()} selected={selected.toString()} title={'Produto'} setSelected={setSelectedProd} />
    )
}