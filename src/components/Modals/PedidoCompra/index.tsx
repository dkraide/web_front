import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import BaseModal from "../Base/Index";
import Loading from "@/components/Loading";
import CustomButton from "@/components/ui/Buttons";
import CustomTable from "@/components/ui/CustomTable";
import { InputGroup } from "@/components/ui/InputGroup";
import SelectProduto from "@/components/Selects/SelectProduto";
import IProduto from "@/interfaces/IProduto";
import IUsuario from "@/interfaces/IUsuario";
import IPedidoCompra, { IPedidoCompraProduto } from "@/interfaces/IPedidoCompra";
import { GetCurrencyBRL, fGetNumber } from "@/utils/functions";
import styles from './styles.module.scss';

interface props {
    isOpen: boolean
    id: number
    user: IUsuario
    setClose: (res?: boolean) => void
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/** Pedido de compra: rascunho editavel; depois de enviado so leitura (com recebimento e cancelamento). */
export default function PedidoCompraForm({ isOpen, id, user, setClose }: props) {
    const empresaId = user.empresaSelecionada;
    const base = `/v2/PedidoCompra/${empresaId}/pedidos`;

    const [pedido, setPedido] = useState<IPedidoCompra | null>(null);
    const [itens, setItens] = useState<IPedidoCompraProduto[]>([]);
    const [frete, setFrete] = useState('0');
    const [desconto, setDesconto] = useState('0');
    const [observacao, setObservacao] = useState('');
    const [dataPrevista, setDataPrevista] = useState('');
    const [loading, setLoading] = useState(id > 0);
    const [enviando, setEnviando] = useState(false);

    const [prod, setProd] = useState<IProduto>();
    const [qtd, setQtd] = useState('');
    const [custo, setCusto] = useState('');
    const [recebidas, setRecebidas] = useState<Record<number, string>>({});

    const status = pedido?.status ?? 'RASCUNHO';
    const editavel = !pedido || status === 'RASCUNHO';
    const podeReceber = status === 'FATURADO' || status === 'ENVIADO';

    const carregar = (p: IPedidoCompra) => {
        setPedido(p);
        setItens(p.produtos ?? []);
        setFrete(String(p.valorFrete ?? 0));
        setDesconto(String(p.valorDesconto ?? 0));
        setObservacao(p.observacao ?? '');
        setDataPrevista(p.dataPrevista ? p.dataPrevista.slice(0, 10) : '');
        const r: Record<number, string> = {};
        (p.produtos ?? []).forEach(i => { r[i.id] = String(p.status === 'FATURADO' ? i.quantidadeFaturada : i.quantidade); });
        setRecebidas(r);
    };

    useEffect(() => {
        if (id <= 0) return;
        api.get(`${base}/${id}`)
            .then(({ data }: AxiosResponse<IPedidoCompra>) => carregar(data))
            .catch((err) => toast.error(`Erro ao buscar pedido. ${err.response?.data || err.message}`))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (prod) setCusto((prod.valorCompra ?? 0).toFixed(2));
    }, [prod]);

    const totalProdutos = useMemo(() => _.sum(itens.map(i => round2(i.quantidade * i.valorUnitario))), [itens]);
    const total = totalProdutos + fGetNumber(frete) - fGetNumber(desconto);

    function addItem() {
        if (!prod || !prod.id) return toast.error('Selecione um produto');
        const q = fGetNumber(qtd);
        if (q <= 0) return toast.error('Quantidade precisa ser maior que zero');
        if (itens.some(i => i.produtoId === prod.id)) return toast.error('Produto ja adicionado ao pedido');
        const c = fGetNumber(custo);
        setItens([...itens, {
            id: 0, pedidoCompraId: pedido?.id ?? 0, empresaId, produtoId: prod.id, codigoFornecedor: prod.codigoFornecedor,
            nomeProduto: prod.nome, quantidade: q, valorUnitario: c, valorTotal: round2(q * c), quantidadeFaturada: 0, quantidadeRecebida: 0,
        }]);
        setProd(undefined); setQtd('');
    }

    async function chamar(acao: () => Promise<AxiosResponse<IPedidoCompra>>, msg: string, fechar = false) {
        setEnviando(true);
        try {
            const { data } = await acao();
            toast.success(msg);
            if (fechar) setClose(true); else carregar(data);
            return data;
        } catch (err: any) {
            toast.error(String(err.response?.data || err.message));
        } finally {
            setEnviando(false);
        }
    }

    const corpo = () => ({
        id: pedido?.id ?? 0, fornecedorId: pedido?.fornecedorId ?? 0, observacao,
        dataPrevista: dataPrevista || null, valorFrete: fGetNumber(frete), valorDesconto: fGetNumber(desconto),
        produtos: itens.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, valorUnitario: i.valorUnitario })),
    });

    const salvar = () => chamar(() => api.post(`${base}`, corpo()), 'Rascunho salvo.');
    async function salvarEEnviar() {
        const salvo = await chamar(() => api.post(`${base}`, corpo()), 'Rascunho salvo.');
        if (salvo) await chamar(() => api.post(`${base}/${salvo.id}/Enviar`), 'Pedido enviado.', true);
    }
    function cancelar() {
        if (!pedido || !window.confirm(`Cancelar o pedido ${pedido.numero}?`)) return;
        chamar(() => api.post(`${base}/${pedido.id}/Cancelar`), 'Pedido cancelado.', true);
    }
    function receber() {
        if (!pedido) return;
        const semFaturamento = status === 'ENVIADO';
        const aviso = semFaturamento
            ? 'Este pedido ainda nao foi faturado pelo fornecedor. Receber assim mesmo e dar entrada no estoque?'
            : 'Confirmar o recebimento e dar entrada no estoque?';
        if (!window.confirm(aviso)) return;
        const lista = itens.map(i => ({ id: i.id, quantidadeRecebida: fGetNumber(recebidas[i.id] ?? '0') }));
        chamar(() => api.post(`${base}/${pedido.id}/Receber`, { semFaturamento, itens: lista }), 'Recebimento confirmado. Estoque atualizado.', true);
    }

    const colunas = [
        ...(editavel ? [{
            name: '#', width: '8%', grow: 0,
            cell: (row: IPedidoCompraProduto) => <CustomButton typeButton={'danger'} onClick={() => setItens(itens.filter(i => i.produtoId !== row.produtoId))}><FontAwesomeIcon icon={faTrash} /></CustomButton>,
        }] : []),
        { name: 'Produto', selector: (row: IPedidoCompraProduto) => row.nomeProduto, sortable: true },
        { name: 'Cód. forn.', selector: (row: IPedidoCompraProduto) => row.codigoFornecedor ?? '', width: '12%' },
        { name: 'Qtd', selector: (row: IPedidoCompraProduto) => row.quantidade, cell: (row: IPedidoCompraProduto) => row.quantidade.toFixed(2), width: '10%' },
        { name: 'Custo un.', selector: (row: IPedidoCompraProduto) => row.valorUnitario, cell: (row: IPedidoCompraProduto) => GetCurrencyBRL(row.valorUnitario), width: '12%' },
        { name: 'Total', selector: (row: IPedidoCompraProduto) => row.quantidade * row.valorUnitario, cell: (row: IPedidoCompraProduto) => GetCurrencyBRL(round2(row.quantidade * row.valorUnitario)), width: '12%' },
        ...(status !== 'RASCUNHO' && status !== 'CANCELADO' ? [{
            name: 'Faturada', selector: (row: IPedidoCompraProduto) => row.quantidadeFaturada, cell: (row: IPedidoCompraProduto) => row.quantidadeFaturada.toFixed(2), width: '10%',
        }] : []),
        ...(podeReceber ? [{
            name: 'Recebida', width: '14%',
            cell: (row: IPedidoCompraProduto) => (
                <input style={{ width: '90px' }} value={recebidas[row.id] ?? ''} onChange={e => setRecebidas({ ...recebidas, [row.id]: e.target.value })} />
            ),
        }] : []),
        ...(status === 'RECEBIDO' ? [{
            name: 'Recebida', selector: (row: IPedidoCompraProduto) => row.quantidadeRecebida, cell: (row: IPedidoCompraProduto) => row.quantidadeRecebida.toFixed(2), width: '10%',
        }] : []),
    ];

    return (
        <BaseModal height={'90%'} width={'90%'} title={pedido ? `Pedido de compra ${pedido.numero} - ${status}` : 'Novo pedido de compra'} isOpen={isOpen} setClose={setClose}>
            {loading ? <Loading /> : (
                <div className={styles.container}>
                    <div className={styles.box}>
                        <InputGroup width={'20%'} type="date" title="Previsão de entrega" readOnly={!editavel} value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} />
                        <InputGroup width={'15%'} title="Frete" readOnly={!editavel} value={frete} onChange={e => setFrete(e.target.value)} />
                        <InputGroup width={'15%'} title="Desconto" readOnly={!editavel} value={desconto} onChange={e => setDesconto(e.target.value)} />
                        <InputGroup width={'50%'} title="Observação" readOnly={!editavel} value={observacao} onChange={e => setObservacao(e.target.value)} />
                    </div>
                    <hr />
                    {editavel && (
                        <div className={styles.box}>
                            <h3>Adicionar itens</h3>
                            <SelectProduto filtroFinalidade ignore={itens.map(i => i.produtoId)} width={'50%'} selected={prod?.id || 0} setSelected={setProd} />
                            <InputGroup width={'15%'} title="Qtd" value={qtd} onChange={e => setQtd(e.target.value)} />
                            <InputGroup width={'15%'} title="Custo un." value={custo} onChange={e => setCusto(e.target.value)} />
                            <CustomButton onClick={addItem} typeButton={'dark'} style={{ height: 'fit-content', marginTop: '15px' }}>Adicionar</CustomButton>
                        </div>
                    )}
                    <hr />
                    <CustomTable columns={colunas as any} data={itens} />
                    <div className={styles.button}>
                        <InputGroup width={'18%'} readOnly title="Total do pedido" value={GetCurrencyBRL(total)} />
                        <CustomButton typeButton={'secondary'} onClick={() => setClose()}>Fechar</CustomButton>
                        {pedido && (status === 'RASCUNHO' || status === 'ENVIADO') && (
                            <CustomButton typeButton={'danger'} loading={enviando} onClick={cancelar}>Cancelar pedido</CustomButton>
                        )}
                        {editavel && <CustomButton typeButton={'secondary'} loading={enviando} onClick={salvar}>Salvar rascunho</CustomButton>}
                        {editavel && <CustomButton typeButton={'dark'} loading={enviando} onClick={salvarEEnviar}>Salvar e enviar</CustomButton>}
                        {podeReceber && <CustomButton typeButton={'dark'} loading={enviando} onClick={receber}>Confirmar recebimento</CustomButton>}
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
