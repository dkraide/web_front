import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IVendaProduto from "@/interfaces/IVendaProduto";
import SelectProduto from "@/components/Selects/SelectProduto";
import { useEffect, useState } from "react";
import IProduto from "@/interfaces/IProduto";
import { useForm } from "react-hook-form";
import { InputForm } from "@/components/ui/InputGroup";
import { fGetNumber, fGetOnlyNumber, imprimirNFce, onFocus } from "@/utils/functions";
import { toast } from "react-toastify";
import IVenda from "@/interfaces/IVenda";
import IFormaPagamento from "@/interfaces/IFormaPagamento";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import _ from "lodash";
import IVendaPagamento from "@/interfaces/IVendaPagamento";
import LoadingModal from "@/components/Modals/LoadingModal";
import SelectCliente from "@/components/Selects/SelectCliente";
import { InputFormSm } from "@/components/ui/InputFormSm";
import { apiViaCep } from "@/services/apiViaCep";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import ImpressaoDialog from "../ImpressaoDialog";
import GerarNFCe from "../GerarNFCe";

interface cancelarProps {
    isOpen: boolean
    venda: IVenda
    caixa: IMovimentoCaixa
    usuario: IUsuarioCaixa
    setClose: (res: boolean) => void
}
export default function FinalizarVenda({usuario,caixa, venda, isOpen, setClose }: cancelarProps) {

    const [selected, setSelected] = useState(-1);
    const [formas, setFormas] = useState<IFormaPagamento[]>([])
    const [pagamentos, setPagamentos] = useState<IVendaPagamento[]>([])
    const [restante, setRestante] = useState(-1)
    const [troco, setTroco] = useState(0)
    const [loading, setLoading] = useState(false);
    const [onNfce, setOnNfce] = useState(0);
    const [_venda, setVenda] = useState(venda);
    const [impressao, setImpressao] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            await api.get(`/FormaPagamento/List?empresaId=${venda.empresaId}`)
                .then(({ data }: AxiosResponse) => {
                    setFormas(data);
                    setSelected(0);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao carregar formas de pagamento. ${err.response?.data || err.message}`);
                });

        }
        loadData();
        var valorTotal = _.sumBy(venda.produtos, p => p.valorTotal);
        setValue("valorPagar", valorTotal.toFixed(2))
        setRestante(valorTotal);
        onFocus("valorPagar");
        (document.getElementById("valorPagar") as HTMLInputElement).select();
    }, [])


    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();

    function eventKeyUp(e) {
        var key = e.key.toLowerCase();
        switch (key) {
            case "arrowdown": {
                increaseSelectedForma(+1);
                break;
            }
            case "arrowup": {
                increaseSelectedForma(-1);
                break;
            }
            case "escape": {
                setClose(undefined);
            }
            case "enter": {
                addPagamento();
            }
        }
    }
    function keyDownEvent(e) {
        switch (e.key.toLowerCase()) {
            case "f1":
                e.preventDefault();
                onFocus("desconto");
                break;
            case "f2":
                e.preventDefault();
                break;
            case "f4":
                e.preventDefault();
                onFocus("acrescimo");
                break;

        }
    }
    function increaseSelectedForma(value: number) {
        if (!formas || formas.length == 0) {
            return;
        }
        if (value > 0) {
            if (formas.length == selected + 1) {
                setSelected(0);
            } else {
                setSelected(selected + 1);
            }

        } else {
            if (selected == 0) {
                setSelected(formas.length - 1);
            } else {
                setSelected(selected - 1);
            }
        }
    }
    useEffect(() => {
        if (selected < 0) {
            return;
        }
        var container = document.getElementsByClassName(styles.formas).item(0) as HTMLElement;
        var element = container.children[selected] as HTMLElement;
        //Determine container top and bottom
        let cTop = container.scrollTop + container.offsetTop;
        let cBottom = cTop + container.clientHeight;

        //Determine element top and bottom
        let eTop = element.offsetTop;
        let eBottom = eTop + element.clientHeight;

        //Check if out of view
        if (eTop < cTop) {
            container.scrollTop -= (cTop - eTop);
        }
        else if (eBottom > cBottom) {
            container.scrollTop += (eBottom - cBottom);
        }
        (document.getElementById("valorPagar") as HTMLInputElement).select();
    }, [selected])

    useEffect(() => {
        if (!pagamentos) {
            return;
        }
        calculaRestante();
    }, [pagamentos])

    function addPagamento() {
        var forma = formas[selected];
        var valor = fGetNumber(getValues("valorPagar"));
        if (valor > restante) {
            valor = restante;
        }
        var vendaPagamento = {
            forma: forma,
            idPagamento: 0,
            idVenda: 0,
            venda: undefined,
            valor: valor,
            valorJuros: 0,
            id: 0,
            vendaId: 0,
            formaPagamentoId: forma.id,
            descricao: forma.nome,
            empresaId: venda.empresaId
        } as IVendaPagamento;
        pagamentos.push(vendaPagamento);
        setPagamentos([...pagamentos]);
        (document.getElementById("valorPagar") as HTMLInputElement).select();

    }

    function calculaRestante() {
        var subTotal = _.sumBy(venda.produtos, p => p.valorTotal);
        var valorPago = _.sumBy(pagamentos, p => p.valor);
        var desconto = fGetNumber(getValues("desconto"));
        if (desconto >= subTotal) {
            toast.error(`Impossivel dar 100% ou mais de desconto.`);
            onFocus("desconto");
            return;
        }
        var acrescimo = fGetNumber(getValues("acrescimo"));
        var resultado = (subTotal - desconto + acrescimo) - valorPago;
        setRestante(resultado);
        setValue("valorPagar", resultado.toFixed(2));
        onFocus("valorPagar", true);
        venda.valorSubTotal = subTotal;
        venda.valorDesconto = desconto;
        venda.valorAcrescimo = acrescimo;
        venda.valorTotal = subTotal - desconto + acrescimo;
        venda.logradouro = getValues("logradouro");
        venda.bairro = getValues("bairro");
        venda.municipio = getValues("cidade");
        venda.cep = getValues("cep");
        venda.numero = getValues("nro");
        venda.complemento = getValues("compl");
        venda.clienteId = _venda.clienteId;
        venda.idCliente = _venda.idCliente;
        if(venda.valorTotal <= 0){
            toast.error(`Valor total invalido.`);
            return;
        }
        return resultado;
    }


    function imprimir(){
        if(venda.nnf > 0){
            imprimirNFce(impressao);
        }else{
            var res = window.open(`/pdv/impressao/?id=${impressao}`);
        }

    }
    useEffect(() => {
        if (restante != 0) {
            return;
        }
        const enviarVenda = async () => {
            if(!caixa){
                toast.error(`Caixa fechado`);
                return;
            }
            setLoading(true);
            venda.pagamentos = pagamentos;
            venda.statusVenda = true;
            venda.idMovimentoCaixa = caixa.idMovimentoCaixa;
            venda.movimentoCaixaId = caixa.id;
            venda.idUsuario = usuario.idUsuario;
            venda.usuarioId = usuario.id;
            await api.post(`/PDV/CreateVenda`, venda)
                .then(({ data }: AxiosResponse) => {
                    toast.success('Venda enviada com sucesso!!');
                    gerarNFce(data.id)

                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao enviar venda. ${err.response?.data || err.message}`);
                });
            setLoading(false);
        }
        enviarVenda();
    }, [restante])

    function getValorTroco(e: any) {
        var valor = Number(e?.currentTarget?.value);
        if (isNaN(valor) || valor < restante) {
            setTroco(0);
            return;
        }
        setTroco(valor - restante);
    }


    function getCep() {
        var cep = fGetOnlyNumber(getValues("cep"));
        apiViaCep.get(`/${cep}/json`)
            .then(({ data }: AxiosResponse) => {
                setValue("logradouro", data.logradouro);
                setValue("bairro", data.bairro);
                setValue("cidade", data.localidade);
                onFocus("nro");

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar o cep. ${err.message}`);
            })
        console.log(cep);
    }

    async function limpar() {
        setPagamentos([]);
    }


    function gerarNFce(vendaId: number){
        var gerar = false;
        venda.pagamentos.forEach((pagamento) => {
            if(pagamento.forma.geraFaturamento){
                gerar = true;
            }
        })
        if(gerar){
            setOnNfce(vendaId);
        }else{
            setImpressao(vendaId);
        }

    }


    if(onNfce > 0){
        return <GerarNFCe id={onNfce} isOpen={onNfce > 0} setClose={
            (res) => 
            {
                if(res){
                    venda.nnf = 1;
                }
                setOnNfce(0);
                setImpressao(onNfce); }} />
    }



    if(impressao > 0){

        return <ImpressaoDialog isOpen={impressao > 0} setClose={(v) => { 
            if(v){
                imprimir();
            }
            setClose(true)
        }} />

    }


    return (
        <BaseModal color={'#d1ebf5'} width={'60%'} height={'70%'} title={'Finalizar Venda'} isOpen={isOpen} setClose={() => { setClose(undefined) }}>
            <div className={styles.content}>
                <div style={{ width: '50%', height: '100%' }}>
                    <div style={{ height: '50%' }}>
                        <div className={styles.formaPagamento}>
                            <h5>Formas de Pagamentos</h5>
                            <ul className={styles.formas} style={{ height: '200px' }}>
                                {formas?.map((forma, index) => <li onClick={() => { setSelected(index) }} className={selected == index ? styles.selected : undefined} key={forma.id}>{forma.nome}</li>)}
                            </ul>
                            <div className={styles.row}>
                                <InputForm onKeyDown={keyDownEvent} onChange={getValorTroco} autoComplete={'off'} onKeyUp={eventKeyUp} id="valorPagar" width={'50%'} title={'Valor a Pagar'} register={register} errors={errors} inputName={'valorPagar'} />
                                <CustomButton onClick={addPagamento} style={{ height: '40px', marginTop: '10px' }} typeButton={'success'}>Pagar</CustomButton>
                            </div>
                        </div>
                    </div>
                    <div className={styles.formaPagamento}>
                        <h5>Cliente</h5>
                        <SelectCliente selected={_venda.clienteId} setSelected={(c) => { setVenda({ ..._venda, clienteId: c.id, idCliente: c.idCliente }) }} />
                    </div>
                    <div className={[styles.row, styles.formaPagamento].join(' ')}>
                        <h5>Entrega</h5>
                        <InputFormSm width={'100%'} title={'Logradouro'} register={register} errors={errors} inputName={'logradouro'} />
                        <InputFormSm id="nro" width={'30%'} title={'Nro'} register={register} errors={errors} inputName={'nro'} />
                        <InputFormSm width={'30%'} title={'Compl'} register={register} errors={errors} inputName={'compl'} />
                        <InputFormSm onKeyUp={(e) => {
                            console.log(e.key);
                            if (e.key.toLowerCase() == "enter") {
                                getCep();
                            }
                        }} onBlur={getCep} width={'40%'} title={'CEP'} register={register} errors={errors} inputName={'cep'} />
                        <InputFormSm width={'50%'} title={'Bairro'} register={register} errors={errors} inputName={'bairro'} />
                        <InputFormSm width={'50%'} title={'Cidade'} register={register} errors={errors} inputName={'cidade'} />
                    </div>
                </div>
                <div style={{ width: '50%', height: '100%' }}>
                    <div className={styles.formaPagamento}>
                        <h5>Pagamento Realizados</h5>
                        <ul className={styles.formas} style={{ height: '200px' }}>
                            {pagamentos?.map((forma, index) => <li key={forma.id}>R${forma.valor.toFixed(2)} - {forma.descricao}</li>)}
                        </ul>
                        <div className={styles.row}>
                            <CustomButton onClick={limpar} typeButton={'danger'}>Limpar</CustomButton>
                        </div>
                    </div>
                    <div className={styles.formaPagamento}>
                        <h5>Totais</h5>
                        <ul className={styles.formas}>
                            <li className={styles.liTotal}>
                                <label>Sub-Total</label>
                                <label>R$ {_.sumBy(venda.produtos, p => p.valorTotal).toFixed(2)}</label>
                            </li>
                            <li className={[styles.liTotal].join(' ')}>
                                <label>Descontos (F1)</label>
                                <input onKeyDown={keyDownEvent}  id="desconto" onFocus={(e) => { e.currentTarget.select(); }} {...register('desconto')} defaultValue={venda.valorDesconto?.toFixed(2) || '0.00'} onBlur={() => { calculaRestante() }} />
                            </li>
                            <li className={[styles.liTotal].join(' ')}>
                                <label>Acresimos (F4)</label>
                                <input id="acrescimo" onKeyDown={keyDownEvent}  onFocus={(e) => { e.currentTarget.select(); }} {...register('acrescimo')} defaultValue={venda.valorAcrescimo?.toFixed(2) || '0.00'} onBlur={() => { calculaRestante() }} />
                            </li>
                            <li className={styles.liTotal}>
                                <label>Valor Pago</label>
                                <label>R$ {_.sumBy(pagamentos, p => p.valor).toFixed(2)}</label>
                            </li>
                            <li className={styles.liTotal}>
                                <label>Restante</label>
                                <label>R$ {restante.toFixed(2)}</label>
                            </li>
                            <li className={[styles.liTotal, styles.selected].join(' ')}>
                                <label>Troco</label>
                                <label>R$ {troco.toFixed(2)}</label>
                            </li>
                        </ul>
                        <div className={styles.row}>
                        </div>
                    </div>
                </div>
                {loading && <LoadingModal isOpen={loading} setClose={() => { }} />}
            </div>
        </BaseModal>
    )
}
