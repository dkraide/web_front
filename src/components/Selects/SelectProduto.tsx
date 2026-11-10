import { SelectHTMLAttributes, forwardRef, useContext, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AuthContext } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { AxiosError, AxiosResponse } from "axios";
import IProduto from "@/interfaces/IProduto";
import _ from 'lodash';
import { SelectBase, SelectBaseRef } from "./SelectBase";
import { SelectInstance } from "react-select";
import MultiSelect from "@/components/ui/MultiSelect";
import { FINALIDADES_VISIVEIS, finalidadeKey } from "@/utils/finalidade";

interface selProps {
    selected: number;
    setSelected: (value: IProduto) => void;
    width?: string;
    ignore?: number[];
    id?: string
    empresaId?: number
    onKeyDown?: (e) => void
    includeInativos?: boolean
    /** Traz tambem os insumos e mostra um filtro de finalidade (telas de estoque). */
    filtroFinalidade?: boolean
}


export  const  SelectProdutoRef = forwardRef<SelectInstance<any>, selProps>(function MyInput(props, ref) {
    const {selected, setSelected, width, ignore, id, onKeyDown} = props;
    const [formas, setFormas] = useState<IProduto[]>([]);
    const { getUser } = useContext(AuthContext);
    const loadFormas = async () => {
        const res = await getUser();
        let ret = await api.get(`/Produto/List?EmpresaId=${res?.empresaSelecionada}&status=true`)
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
        let data = [] as any[];
        formas.map((forma, index) => {
            let ind = _.findIndex(ignore, p => p == forma.id);
           if(ind >= 0){
            return;
           }
            let x = {
                value: forma.id.toString(),
                label: `${forma.cod.toString()} - ${forma.nome}` || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any) {
        let index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }
    function getFirst(){
       if(formas.length > 0){
         return formas[0].id.toString();
       }else{
         return "";
       }
    }
    return (
        <SelectBaseRef onKeyDown={onKeyDown} ref={ref} id={id} width={width} datas={getData()} selected={selected?.toString() || getFirst()} title={'Produto'} setSelected={setSelectedProd} />
    )
  });

export default function SelectProduto({includeInativos, empresaId, id,ignore, width, selected, setSelected, filtroFinalidade }: selProps) {
    const [todas, setFormas] = useState<IProduto[]>([]);
    const [finalidades, setFinalidades] = useState<string[]>(FINALIDADES_VISIVEIS.map(f => f.value));
    const formas = filtroFinalidade ? todas.filter(p => finalidades.includes(finalidadeKey(p.finalidade))) : todas;
    const { getUser } = useContext(AuthContext);
    const loadFormas = async () => {
        let res = 0;
        if(empresaId){
            res =  empresaId;
        }else{
            let user  = await getUser();
            res = user.empresaSelecionada;
        }
        // /Produto/List nao traz insumos; /Estoque/List traz todos os ativos
        const url = filtroFinalidade ? `/Estoque/List?EmpresaId=${res}` : `/Produto/List?EmpresaId=${res}${includeInativos ? '' : '&status=true'}`;
        let ret = await api.get(url)
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
        let data = [] as any[];
        let isSelected = false;
        formas.map((forma, index) => {
            let ind = _.findIndex(ignore, p => p == forma.id);
           if(ind >= 0){
            return;
           }
           if(!isSelected && !selected){
              setSelected(forma);
              isSelected = true;
           }
            let x = {
                value: forma.id.toString(),
                label: `${forma.cod.toString()} - ${forma.nome}` || ''
            }
            data.push(x);
        });
        return data;
    }
    function setSelectedProd(value: any) {
        let index = _.findIndex(formas, p => p.id == value);
        if (index >= 0) {
            setSelected(formas[index]);
        }
    }
    return (
        <>
            {filtroFinalidade && (
                <div style={{ marginBottom: 8 }}>
                    <MultiSelect title="Finalidade" options={FINALIDADES_VISIVEIS.map(f => ({ value: f.value, label: f.label }))} selected={finalidades} onChange={setFinalidades} />
                </div>
            )}
            <SelectBase   id={id} width={width} datas={getData()} selected={selected.toString()} title={'Produto'} setSelected={setSelectedProd} />
        </>
    )
}