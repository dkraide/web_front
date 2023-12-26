import CustomButton from "@/components/ui/Buttons";
import styles from "./styles.module.scss";
import BaseModal from "@/components/Modals/Base/Index";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import LoadingModal from "@/components/Modals/LoadingModal";
import { format } from "date-fns";
import _ from "lodash";
import IVenda from "@/interfaces/IVenda";
import CustomTable from "@/components/ui/CustomTable";
import { Badge, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPrint, faTrash, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { LabelGroup } from "@/components/ui/LabelGroup";
import BoxInfo from "@/components/ui/BoxInfo";
import CancelarVenda from "./CancelarVenda";
import { imprimirNFce } from "@/utils/functions";
import GerarNFCe from "../GerarNFCe";

interface cancelarProps {
    isOpen: boolean
    setClose: (res: boolean) => void
    caixa?: IMovimentoCaixa
    usuario: IUsuarioCaixa
}
export default function Vendas({ usuario, caixa, isOpen, setClose }: cancelarProps) {
    const {
        register,
        formState: { errors } } =
        useForm();

    const [loading, setLoading] = useState(false);
    const [vendas, setVendas] = useState([]);
    const [cancel, setCancel] = useState<IVenda | undefined>(undefined);
    const [gerarNfce, setGerarNfce] = useState(0);

    const loadData = async () => {
        setLoading(true);
        await api.get(`/MovimentoCaixa/Vendas?MovimentoCaixaId=${caixa.id}&OnlyDinheiro=false`)
            .then(({ data }: AxiosResponse) => {
                setVendas(data);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao carregar vendas`);
            })
        setLoading(false);

    }
    useEffect(() => {
        if (isOpen && caixa.id != undefined) {
            loadData();
        }
    }, [isOpen])

    if (loading) {
        return <LoadingModal isOpen={loading} setClose={() => { }} />
    }
    if(gerarNfce > 0){
        return <GerarNFCe id={gerarNfce} isOpen={gerarNfce > 0} setClose={(v) => {
            if(v){
                setLoading(true);
                loadData();
            }
            setGerarNfce(0);

        }}/>
    }

    const columns = [
        {
            name: 'Venda',
            cell: (row: IVenda) =>
                <div className={styles.buttons}>
                    {row.statusVenda && <Button size={'sm'} variant={'primary'} onClick={async () => {
                        if (row.nnf > 0) {
                            await imprimirNFce(row.id);

                        } else {
                            window.open(`/pdv/impressao/?id=${row.id}`)
                        }
                    }}><FontAwesomeIcon color={'white'} icon={faPrint} /></Button>}
                    {row.statusVenda && <Button size={'sm'} variant={'danger'} onClick={() => { setCancel(row) }}><FontAwesomeIcon color={'white'} icon={faTrashAlt} /></Button>}
                </div>,
            sortable: true,
            selector: row => row.idVenda,
            width: '10%',
        },
        {
            name: 'Data',
            cell: ({ dataVenda }: IVenda) => <p>{format(new Date(dataVenda.toString()), 'dd/MM/yyyy HH:mm')}</p>,
            selector: row => row.dataVenda,
            sortable: true,
            width: '20%',
        },
        {
            name: 'Usuario',
            selector: row => row.usuario?.nome || '--',
            sortable: true,
            width: '20%',
        },
        {
            name: 'NFC-e',
            selector: (row : IVenda) => <Badge bg={row?.xml?.retornoNro == 100 ? 'success' : 'primary'}><b onClick={() => {
                if(row?.xml?.retornoNro == 100){
                    return;
                }
                setGerarNfce(row.id);
            }} style={{fontSize: '14px', cursor:row?.xml?.retornoNro == 100 ? 'default' : 'pointer'}}>{row?.xml?.retornoNro == 100 ? 'NFC-e Gerada' : 'Gerar NFC-e'}</b></Badge>,
            sortable: true,
            width: '20%',
        },
        {
            name: 'Status',
            selector: row => row['statusVenda'] ? 'OK' : 'CANCELADO',
            sortable: true,
            width: '10%',
        },
        {
            name: 'Valor',
            selector: row => `${row.valorTotal.toFixed(2)}`,
            sortable: true,
            width: '10%',
        }
    ]
    const vendaDetalhe = (row) => {
        var index = _.findIndex(vendas, p => p.id == row.data.id);
        var venda = vendas[index] as IVenda;
        const [loading, setLoading] = useState(false);
        useEffect(() => {
            if (!venda.pagamentos || !venda.produtos) {
                const getVenda = async () => {
                    setLoading(true);
                    await api.get(`/Venda/Select?id=${venda.id}`)
                        .then(({ data }: AxiosResponse) => {
                            var index = _.findIndex(vendas, p => p.id == venda.id);
                            vendas[index] = data;
                            setVendas(vendas);
                        }).catch((err: AxiosError) => {
                            toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);

                        });
                    setLoading(false);
                };
                getVenda();
            }
        }, []);

        if (loading) {
            return <Spinner title={'Carregando vendas'} />
        }
        return <div className={styles.detalheVenda}>
            <div style={{
                height: '100%', width: '25%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: '5px',
                alignItems: 'flex-start', justifyContent: 'flex-start'
            }}>
                <LabelGroup width={'50%'} title={'Numero'} value={venda.id} />
                <LabelGroup width={'50%'} title={'Data'} value={format(new Date(venda.dataVenda), 'dd/MM/yy HH:mm')} />
                <LabelGroup width={'50%'} title={'Caixa'} value={venda.movimentoCaixaId} />
                <LabelGroup width={'50%'} title={'Usuario'} value={venda.usuario?.nome} />
                <LabelGroup width={'50%'} title={'Status'} value={venda.statusVenda ? 'OK' : 'CANCELADA'} />
                <LabelGroup width={'50%'} title={'NFCE'} value={venda.estd ? 'SIM' : 'NAO'} />
                {!venda.statusVenda && <LabelGroup width={'100%'} title={'Cancelamento'} value={venda.motivoCancelamento} />}
                <LabelGroup width={'100%'} title={'Entrega'} value={venda.logradouro.length > 0 ? `${venda.logradouro}, ${venda.numero} - ${venda.bairro}` : '--'} />
                <LabelGroup width={'100%'} title={'Cliente'} value={venda.cliente ? venda.cliente.nome : '--'} />
                <LabelGroup width={'50%'} title={'Produtos'} value={`R$ ${venda.valorSubTotal.toFixed(2)}`} />
                <LabelGroup width={'50%'} title={'Descontos'} value={`R$ ${venda.valorDesconto.toFixed(2)}`} />
                <LabelGroup width={'50%'} title={'Acrescimos'} value={`R$ ${venda.valorAcrescimo.toFixed(2)}`} />
                <LabelGroup width={'50%'} title={'Total'} value={`R$ ${venda.valorTotal.toFixed(2)}`} />
            </div>
            <div style={{ width: '25%' }}>
                <ul className={styles.list}>
                    <li><b style={{ width: '70%' }}>Pagamento</b><b style={{ width: '30%' }}>Valor</b></li>
                    {venda?.pagamentos?.map(p => <li><label style={{ width: '70%' }}>{[p.descricao]}</label> <label style={{ width: '30%' }}>R${p.valor.toFixed(2)}</label></li>)}
                </ul>
            </div>
            <div style={{ width: '50%' }}>
                <ul className={styles.list}>
                    <li><b style={{ width: '60%' }}>Produto</b><b style={{ width: '20%' }}>Qntd</b><b style={{ width: '20%' }}>Total</b></li>
                    {venda?.produtos?.map(p => <li><label style={{ width: '60%' }}>{[p.nomeProduto]}</label> <label style={{ width: '20%' }}> {p.quantidade.toFixed(2)}</label> <label style={{ width: '20%' }}>R${p.valorTotal.toFixed(2)}</label></li>)}
                </ul>
            </div>

        </div>
    }
    if (cancel != undefined) {
        return <CancelarVenda venda={cancel} usuario={usuario} isOpen={cancel != undefined} setClose={(v) => {
            if (v) {
                loadData();
            }
            setCancel(undefined);
        }} />

    }
    return (
        <BaseModal headerOff={!caixa} width={'100%'} height={'50%'} title={'Vendas'} isOpen={isOpen} setClose={() => { setClose(false) }}>
            <div className={styles.content}>
                <CustomTable
                    expandableComponent={vendaDetalhe}
                    expandableIcon={<FontAwesomeIcon color={'var(--main)'} icon={faEye} />}
                    pagination data={vendas} columns={columns} />
                <div className={styles.footer}>
                    <BoxInfo title={'Vendas'} value={`R$ ${_.sumBy(vendas, v => v.statusVenda ? v.valorTotal : 0).toFixed(2)}`} />
                    <BoxInfo title={'NFC-e'} value={`R$ ${_.sumBy(vendas, v => (v.estd && v.statusVenda) ? v.valorTotal : 0).toFixed(2)}`} />
                    <BoxInfo title={'Canceladas'} value={`R$ ${_.sumBy(vendas, v => !v.statusVenda ? v.valorTotal : 0).toFixed(2)}`} />

                </div>
            </div>
        </BaseModal>
    )
}



