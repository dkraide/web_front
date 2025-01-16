import styles from './styles.module.scss';
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import IUsuario from "@/interfaces/IUsuario"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { toast } from "react-toastify"
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import CustomTable from "@/components/ui/CustomTable"
import Vendas from '@/components/PDV/Vendas';
import IPedidoOnline, { IPedidoStatus } from '@/interfaces/IPedidoOnline';
import { ceil } from 'lodash';
import { GetCurrencyBRL } from '@/utils/functions';
import Visualizar from '@/components/Modals/Pedido/Visualizar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocation, faLocationPin, faMap, faPhone, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';


interface searchProps {
    dateIn: string
    dateFim: string
}

interface relatorioProps {
    classe: string
    quantidade: number
    venda: number,
    custo: number
}



export default function Pedidos(){
    const [search, setSearch] = useState<searchProps>()
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<relatorioProps[]>([])
    const [pedidos, setPedidos] = useState<IPedidoOnline[]>([])
    const [showPedido, setShowPedido] = useState<IPedidoOnline>()

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])
    const loadData = async () => {
       
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        if (!loading) {
            setLoading(true);
        }
        var url = '';
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/pedidoonline/pedido?empresaid=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
            url = `/pedidoonline/pedido?empresaid=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<IPedidoOnline[]>) => {
                setPedidos(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar pedidos. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    
    const renderPedidosPorStatus = (status, titulo) => {
        const handlePrint = (pedidoId) => {
            const pedido = pedidos.find((pedido) => pedido.id === pedidoId);
        
            const printWindow = window.open("", "_blank");
        
            const formatField = (field) => {
                return field ? field : "";
            };
        
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Pedido #${pedido.id}</title>
                        <style>
                            @media print {
                                body {
                                    font-family: Arial, sans-serif;
                                    font-size: 12px;
                                    width: 80mm;
                                    margin: 0;
                                    padding: 0;
                                }
                                .pedido {
                                    width: 100%;
                                    margin: 0;
                                    padding: 0;
                                }
                                .pedido h1 {
                                    font-size: 16px;
                                    text-align: center;
                                    margin: 5px 0;
                                }
                                .pedido p {
                                    margin: 5px 0;
                                }
                                .pedido .flex-container {
                                    display: flex;
                                    justify-content: space-between;
                                }
                                .pedido table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    margin-top: 10px;
                                }
                                .pedido th, .pedido td {
                                    border: 1px solid #ddd;
                                    padding: 5px;
                                    text-align: center;
                                    font-size: 12px;
                                }
                                .pedido th {
                                    background-color: #f2f2f2;
                                }
                                .pedido .observacao {
                                    margin-top: 10px;
                                    font-style: italic;
                                    color: #555;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="pedido">
                            <h1>Pedido #${pedido.id}</h1>
                            <div class="flex-container">
                                <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                                <p><strong>Status:</strong> ${pedido.status}</p>
                            </div>
                            <div class="flex-container">
                                <p><strong>Pagamento:</strong> ${pedido.pagamento || 'Não informado'}</p>
                                <p><strong>Tipo:</strong> ${pedido.isParaEntrega ? "ENTREGA" : "RETIRADA"}</p>
                            </div>
                            ${
                                pedido.telefone
                                    ? `<p><strong>Telefone:</strong> ${pedido.telefone}</p>`
                                    : ""
                            }
                            <div class="flex-container">
                                <p><strong>Valor Frete:</strong> ${GetCurrencyBRL(pedido.valorFrete)}</p>
                                <p><strong>Valor Total:</strong> ${GetCurrencyBRL(pedido.valorTotal)}</p>
                            </div>
                            ${
                                pedido.produtos.some(prod => prod.observacao) 
                                    ? `<p class="observacao"><strong>Observação:</strong> ${pedido.produtos.map(prod => prod.observacao).filter(obs => obs).join(', ')}</p>`
                                    : ''
                            }
                            <table>
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Qntd</th>
                                        <th>Valor un.</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pedido.produtos.map(produto => `
                                        <tr>
                                            <td>${produto.nomeProduto}</td>
                                            <td>${produto.quantidade}</td>
                                            <td>${GetCurrencyBRL(produto.valorUnitario)}</td>
                                            <td>${GetCurrencyBRL(produto.quantidade * produto.valorUnitario)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <script>
                            window.print();
                            window.onafterprint = function () {
                                window.close();
                            };
                        </script>
                    </body>
                </html>
            `);
        };
    
        const handleStatusChange = async (pedidoId, newStatus) => {
            try {
                // Enviar a requisição POST para atualizar o status do pedido no backend
                let response;
        
                // Dependendo do status, faça a chamada correspondente ao endpoint da API
                if (newStatus === "PREPARANDO") {
                    response = await api.post(`/PedidoOnline/Preparar?PedidoId=${pedidoId}`);
                } else if (newStatus === "ENTREGANDO") {
                    response = await api.post(`/PedidoOnline/Entregar?PedidoId=${pedidoId}`);
                } else if (newStatus === "FINALIZADO") {
                    response = await api.post(`/PedidoOnline/Finalizar?PedidoId=${pedidoId}`);
                } else if (newStatus === "CANCELADO") {
                    response = await api.post(`/PedidoOnline/Cancelar?PedidoId=${pedidoId}`);
                }

        
                // Verifique se a resposta foi bem-sucedida
                if (response.status === 200) {
                    // Atualize o status localmente
                    const updatedPedidos = pedidos.map((pedido) =>
                        pedido.id === pedidoId ? { ...pedido, status: newStatus } : pedido
                    );
                    setPedidos(updatedPedidos);
                } else {
                    alert('Erro ao atualizar status no servidor');
                }
            } catch (error) {
                console.error('Erro ao enviar a requisição:', error);
                alert('Erro ao atualizar status');
            }
        };
    
        const getNextStatus = (currentStatus) => {
            const statusMap = {
                NOVO: "PREPARANDO",
                PREPARANDO: "ENTREGANDO",
                ENTREGANDO: "FINALIZADO",
                FINALIZADO: null,
            };
            return statusMap[currentStatus];
        };
    
        return (
            <div className={styles[status.toLowerCase()]}>
                <h3>{titulo}</h3>
                <div>
                    {pedidos
                        .filter((pedido) => pedido.status === status)
                        .sort((a, b) => Number(new Date(b.dataPedido)) - Number(new Date(a.dataPedido))) // Ordenação por data decrescente
                        .map((pedido) => {
                            const dataPedido = new Date(pedido.dataPedido);
                            const nextStatus = getNextStatus(pedido.status);
    
                            return (
                                <div key={pedido.id} className={styles.pedido}>
                                    <div className={styles.pedidoHeader}>
                                        <h5
                                            className={styles.buttonmodal}
                                            onClick={() => setShowPedido(pedido)}
                                        >
                                            {`#${pedido.id} - ${pedido.cliente}`}
                                        </h5>
                                        <span className={styles.pedidoHorario}>
                                            {dataPedido.toLocaleString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <p className={styles.entrega}>
                                        <span className={styles.left}>
                                            {pedido.isParaEntrega ? "ENTREGA" : "RETIRADA"}
                                        </span>
                                        <span className={styles.right}>
                                            {`Total: ${GetCurrencyBRL(pedido.valorTotal)}`}
                                        </span>
                                    </p>
                                    {pedido.isParaEntrega && (
                                        <p className={styles.endereco}>
                                            <FontAwesomeIcon
                                                icon={faLocationPin}
                                                className={styles.icon}
                                            />
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    `${pedido.logradouro || ""}, ${pedido.bairro || ""}, ${pedido.cidade || ""}, ${pedido.cep || ""}`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.link}
                                            >
                                                {pedido.logradouro && <span>{pedido.logradouro}</span>}
                                                {pedido.bairro && <span>, {pedido.bairro}</span>}
                                                {pedido.cidade && <span>, {pedido.cidade}</span>}
                                                {pedido.cep && <span>, {`CEP: ${pedido.cep}`}</span>}
                                            </a>
                                        </p>
                                    )}
                                    {pedido.telefone && (
                                        <div className={styles.whatsappContainer}>
                                            <a
                                                href={`https://web.whatsapp.com/send?phone=${pedido.telefone.replace(
                                                    /\D/g,
                                                    ""
                                                )}&text=Olá, gostaria de saber mais sobre o pedido ${pedido.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.whatsappButton}
                                            >
                                                WhatsApp
                                            </a>
                                        </div>
                                    )}

                                    <div className={styles.statusDropdown}>
                                        <div className={styles.statusButtons}>
                                        <button
                                            onClick={() => handleStatusChange(pedido.id, "CANCELADO")}
                                            className={styles.statusButton}
                                        >
                                            Cancelar
                                        </button>
                                            {pedido.status !== "FINALIZADO" && nextStatus && (
                                                <button
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            pedido.id,
                                                            nextStatus
                                                        )
                                                    }
                                                    className={styles.statusButton}
                                                >
                                                    {pedido.status === "NOVO"
                                                        ? "CONFIRMAR"
                                                        : nextStatus}
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.printButtonContainer}>
                                            <button
                                                onClick={() => handlePrint(pedido.id)}
                                                className={styles.printButton}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPrint}
                                                    className={styles.printIcon}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    };
    
        
    
    
    return(
        <div className={styles.container}>
            <h4>Pedidos</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <div className={styles.pedidos}>
                <div className={styles.novo}>
                    {renderPedidosPorStatus(IPedidoStatus.NOVO, "NOVO")}
                </div>
                <div className={styles.preparando}>
                    {renderPedidosPorStatus(IPedidoStatus.PREPARANDO, "PREPARANDO")}
                </div>
                <div className={styles.entregando}>
                    {renderPedidosPorStatus(IPedidoStatus.ENTREGANDO, "ENTREGANDO")}
                </div>
                <div className={styles.finalizados}>
                    {renderPedidosPorStatus(IPedidoStatus.FINALIZADO, "FINALIZADO")}
                </div>
            </div>
            {!!showPedido && <Visualizar pedido={showPedido} isOpen={!!showPedido} user={user} setClose={() => {setShowPedido(undefined)}} />}
        </div>
    )
}