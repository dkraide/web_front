import IVendaProduto from '@/interfaces/IVendaProduto';
import styles from './styles.module.scss';
import IUsuario from '@/interfaces/IUsuario';
import { InputForm } from '@/components/ui/InputGroup';
import { useForm } from 'react-hook-form';
import { ACTION, fGetNumber, isNullOrWhitespace, onFocus } from '@/utils/functions';
import { AxiosError, AxiosResponse } from 'axios';
import { api } from '@/services/apiClient';
import { toast } from 'react-toastify';
import IProduto from '@/interfaces/IProduto';
import { useEffect, useRef, useState } from 'react';
import LoadingModal from '@/components/Modals/LoadingModal';
import SelectProduto, { SelectProdutoRef } from '@/components/Selects/SelectProduto';
import { SelectInstance } from 'react-select';

type addCarrinhoProps = {
    onAddProduto: (produto: IVendaProduto) => Promise<boolean>
    user: IUsuario
    onFinalizar: () => void
    finalizar: boolean
    onKeyEvent: (e) => void
    action: ACTION
}
export default function AddCarrinho({action, onKeyEvent, finalizar, onAddProduto, user, onFinalizar }: addCarrinhoProps) {

    const [produto, setProduto] = useState<IProduto>()
    const [loading, setLoading] = useState(false);
    const [searchProduto, setSearchProduto] = useState(false);
    const selectRef = useRef<SelectInstance<IProduto | undefined>>(null);

    useEffect(() => {
        //o status do finalizar mudou, isso significa que a telca de finalizar fechou e isso foca que o 
        //campo codProduto deve ser focado novamente
        onFocus("codProduto")
    }, [finalizar]);
    useEffect(() => {

        switch(action){
            case "LIMPAR":
                limparCampos();
                break;
            case '':
            default:
                break;
            
        }

    }, [action])
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    useEffect(() => {

        if(searchProduto){
            onFocus('selectProduto');
        }
    }, [searchProduto])


    function keyEvent(e) {
        var key = e.key.toLowerCase();
        switch (key) {
            case "enter":
                if (e.currentTarget.id == "codProduto") {
                    getProduto();
                }
                else if (e.currentTarget.id == "qntdProduto" || e.currentTarget.id == "valorProduto") {
                    addCarrinho();
                }
                break;
            case "escape":
                limparCampos();
                break;

            case "f5":
                onFinalizar();
                break;
            case "f8":
                setSearchProduto(!searchProduto);
                setTimeout(() => {
                    selectRef.current?.focus();
                }, 100)
                break;

        }
        trataInputCod(e?.currentTarget?.value);
    }

    function trataInputCod(input?: string){
        if(isNullOrWhitespace(input)){
            console.log('valor nulo')

        }

    }


    async function getProduto() {
        var cod = getValues("codProduto");
        if (!cod || cod.length == 0) {
            toast.error(`Digite um codigo valido`);
            return;
        }
        setLoading(true);
        var codProduto = cod.length > 8 ? 0 : fGetNumber(cod);
        var codBarras = cod.length <= 8 ? '' : cod;
        await api.get(`/PDV/SelectProduto?empresaId=${user.empresaSelecionada}&codProduto=${codProduto}&CodigoBarras=${codBarras}`)
            .then(({ data }: AxiosResponse) => {
                if (codProduto > 0) {
                    setValue('nomeProduto', data.nome);
                    setValue('valorProduto', data.valor);
                    setValue('qntdProduto', '1');
                    setTimeout(() => { onFocus("qntdProduto", true); }, 100);
                    setProduto(data);
                } else {
                    setValue('nomeProduto', data[0].nome);
                    setValue('valorProduto', data[0].valor);
                    setValue('qntdProduto', '');
                    setLoading(false);
                    onFocus("qntdProduto", true);
                    setProduto(data[0]);

                }
            }).catch((err: AxiosError) => {
                toast.error(`${err.response?.data || err.message}`);
                onFocus("codProduto", true)
            });
        setLoading(false);
    }

    function limparCampos() {
        setProduto(undefined);
        setValue("codProduto", "");
        setValue("nomeProduto", "");
        setValue("qntdProduto", "");
        setValue("valorProduto", "");
        setTimeout(() => {
            onFocus("codProduto");
        }, (100));
    }

    async function addCarrinho() {

        if (!produto) {
            toast.error(`Selecione um produto.`);
            onFocus("codProduto", true);
            return;
        }
        var qntd = fGetNumber(getValues("qntdProduto"));
        var valor = fGetNumber(getValues("valorProduto"));
        if (qntd <= 0) {
            toast.error(`Quantidade nao pode ser menor ou igual a zero.`);
            onFocus("qntdProduto", true);
            return;
        }
        if (valor <= 0) {
            toast.error(`Valor nao pode ser menor ou igual a zero.`);
            onFocus("valorProduto", true);
            return;
        }

        var vp = {
            idVendaProduto: 0,
            idVenda: 0,
            idPromocao: 0,
            idProduto: produto.idProduto,
            venda: undefined,
            produto: produto,
            promocao: undefined,
            valorUnitario: valor,
            valorTotal: valor * qntd,
            valorCompra: produto.valorCompra,
            quantidade: qntd,
            observacao: undefined,
            nomeProduto: produto.nome,
            produtoId: produto.id,
            vendaId: 0,
            promocaoId: 0,
            id: 0,
            empresaId: 0
        } as IVendaProduto;
        setLoading(true);
        var res = await onAddProduto(vp);
        if (res) {
            limparCampos();
        }
        setLoading(false);
    }

    function keyDownEvent(e) {
        switch (e.key.toLowerCase()) {
            case "f5":
            case "f8":
                e.preventDefault();
                break;
            case "f1":
            case "f2":
            case "f6":
            case "f7":
                onKeyEvent(e);
                break;
        }
    }

    return (
        <div className={styles.addProduto}>
            <h5>Adicionar Produto</h5>
            <InputForm autoComplete={'off'} id="codProduto" onKeyDown={keyDownEvent} onKeyUp={(e) => { keyEvent(e) }
            } width={'10%'} title={'Cod'} register={register} errors={errors} inputName={'codProduto'} />
             {searchProduto  ? 
             <SelectProdutoRef 
             onKeyDown={(e) => {
                if(e.key.toLowerCase() == "f8"){
                    e.preventDefault();
                    setSearchProduto(false);
                    setTimeout(() => {
                        onFocus("codProduto")
                    }, 100)
                }
             }}
             ref={selectRef} id={'selectProduto'} width={'70%'} selected={produto?.id || 0} setSelected={(v: IProduto) => {
                setProduto(v);
                setValue("codProduto", v.cod);
                setValue("nomeProduto", v.nome);
                setValue("valorProduto", v.valor);
                setValue("qntdProduto", 1);
                setTimeout(() => {
                    onFocus("qntdProduto", true);
                    setSearchProduto(false);
                }, 500);

             }}></SelectProdutoRef> :
             <InputForm width={'70%'} title={'Produto'} register={register} errors={errors} inputName={'nomeProduto'} readOnly={true} />}
            <InputForm onKeyUp={keyEvent} id="qntdProduto" width={'10%'} title={'Qntd'} register={register} errors={errors} inputName={'qntdProduto'} />
            <InputForm id="valorProduto" width={'10%'} title={'Valor'} register={register} errors={errors} inputName={'valorProduto'} />
            {loading && <LoadingModal isOpen={loading} setClose={() => { }} />}
        </div>
    )

}