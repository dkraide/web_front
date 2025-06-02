import IProduto from '@/interfaces/IProduto';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import CustomButton from '@/components/ui/Buttons';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import SelectProdutoModal from '@/components/Modals/Produto/SelectProdutoModal';
import { InputGroup } from '@/components/ui/InputGroup';
import { fGetNumber, GetCurrencyBRL } from '@/utils/functions';
import ILancamentoEstoque from '@/interfaces/ILancamentoEstoque';
import ILancamentoEstoqueProduto from '@/interfaces/ILancamentoEstoqueProduto';
import _ from 'lodash';
import SelectIngredienteModal from '@/components/Modals/MateriaPrima/SelectIngredienteModal';
import IMateriaPrima from '@/interfaces/IMateriaPrima';

type itemLancamento = {
    item: {
        cProd: string
        qCom: string
        vUnCom: string
        xProd: number
    },
    ingrediente: any
}

export default function IngredientesEstoqueCadastroXml(){

    const [ingredientes, setIngredientes] = useState<itemLancamento[]>([])
    const {getUser} = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [loadingXml, setLoadingXml] = useState(false);
    const [ingredienteModal, setIngredienteModal] = useState(-1);
    const [message, setMessage] = useState('');

    useEffect(() => {
       const loadData = async () => {
           var user = await getUser();
           setUser(user);
       }
       loadData();
    }, [])
    async function getFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.click();
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            var formData = new FormData();
            formData.append('file', files[0], files[0].name)
            formData.append('EmpresaId', user.empresaSelecionada.toString())
            formData.append('IsProduto', 'false')
            setLoadingXml(true);
            setTimeout(() => {
            }, 500);
            await api.put(`LancamentoEstoque/LoadXML`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
                .then(({ data }: AxiosResponse) => {
                    setIngredientes(data);
                    toast.success(`Itens carregados com sucesso!`);
                }).catch((err: AxiosError) => {
                    toast.error(`Erro ao carregar arquivo. ${err.response?.data || err.message}`);
                });
            setLoadingXml(false);
        }

    }
    function selectProduto(p: IMateriaPrima){
        ingredientes[ingredienteModal].ingrediente = p;
        setIngredientes([...ingredientes]);
        setIngredienteModal(-1);
    }
    if(!ingredientes || ingredientes.length <= 0){
        return(
            <div className={styles['container-xml']}>
                <CustomButton typeButton={'main'} onClick={getFile} loading={loadingXml}>
                    Clique aqui para selecionar o arquivo XML
                </CustomButton>


            </div>
        )
    }
    function onLeave(index, value, field){
        var number = value.toString().replace(`,`, `.`);
       if(field == "multiplicadorFornecedor"){
         if(!ingredientes[index].ingrediente){
            ingredientes[index].ingrediente = {};
         }
         ingredientes[index].ingrediente.multiplicadorFornecedor = number;
       }else{
        ingredientes[index].item[field] = number;
       }
       setIngredientes([...ingredientes]);
    }
    async function updateProdutoInfo(){
        var errors = '';
        var list = ingredientes.map((item) => {
            var p = item.ingrediente;
            if(!p || !p.nome){
                errors += `${item.item.xProd} - Sem referencia no sistema\n`;
            }
            return {
                id: p?.id,
                valorCompra: p?.valorCompra,
                multiplicadorFornecedor: p?.multiplicadorFornecedor,
                codigoFornecedor: item.item.cProd,
            }
        })
        if(errors.length > 0){
             toast.error(errors);
             return false;
        }
        return await api.put(`/MateriaPrima/UpdateFromXML`, list)
        .then(({data}: AxiosResponse) => {
             return true;

        }).catch((err: AxiosError) => {
            toast.error(`Erro ao atualizar ingredientes. ${err.response?.data || err.message}`);
            return false;
        })
    }
    async function createLancamento(){
        var obj = {
          idLancamentoEstoque: 0,
          id: 0,
          dataLancamento: new Date(),
          idPedido: 0,
          arquivoXML: '',
          comentario: 'GERADO A PARTIR DE XML',
          isEntrada: true,
          isProduto: false,
          nomeArquivo: '',
          empresaId: user.empresaSelecionada
        } as ILancamentoEstoque;
        obj.produtos = ingredientes.map((o) => {
            var qtd = fGetNumber(o.item.qCom);
            var mult = fGetNumber(o.ingrediente.multiplicadorFornecedor) || 1;
            var quantidade = qtd * mult;
            const custo = custoUnitario(o); 
            return{
                idLancamentoEstoque: 0,
                idLancamentoEstoqueProduto: 0,
                lancamentoEstoqueId: 0,
                id: 0,
                idProduto: 0,
                produtoId: 0,
                idMateriaPrima:o.ingrediente?.idMateriaPrima ?? 0,
                nomeProduto: o.ingrediente?.nome ?? 'N/D',
                custoUnitario: custo,
                quantidade: Number(quantidade.toFixed(2)),
                produto: undefined,
                materiaPrima: undefined,
                dataLancamento: obj.dataLancamento,
                isEntrada: true,
                empresaId: user.empresaSelecionada,
                materiaPrimaId: o.ingrediente?.id ?? 0,
                observacao: obj.comentario
            } as ILancamentoEstoqueProduto
        });

        return await api.post(`/LancamentoEstoque/CreateIngredientes`, obj).then(({data}: AxiosResponse) => {
            toast.success(`Sucesso ao criar lançamento de Estoque`);
            document.location.href = `/ingredientes/estoque`;
            return true;

        }).catch((err: AxiosError) => {
            toast.error(`Erro ao gerar lançamento de estoque. ${err.response?.data || err.message}`);
            return false;
        })
    }
    async function onSubmit(){
        var errors = '';
        ingredientes.map((item) => {
            var p = item.ingrediente;
            if(!p || !p.nome){
                errors += `${item.item.xProd} - Sem referencia no sistema\n`;
            }
        });
        if(errors.length > 0){
            toast.error(errors);
            return;
       }
       setMessage(`Atualizando Informações dos produtos...`);
       var res = await updateProdutoInfo();
       if(!res){
          setMessage('');
          return;
       }
       setMessage(`Gerando lançamento e calculando estoque...`);
       res = await createLancamento();
       if(!res){
        setMessage('');
        return;
       }
    }

    const quantidadeItens = () => {
        return _.sumBy(ingredientes, (item) => Number(item.item.qCom ?? '0'));
    }

    const valorItens = () => {
        let total =  _.sumBy(ingredientes, (item) => {
              let qCom = fGetNumber(item.item.qCom);
              let vUnCom = fGetNumber(item.item.vUnCom);
              return (qCom * vUnCom) || 0;
        });
        return GetCurrencyBRL(total ?? 0);
    }

    const custoUnitario = (item: itemLancamento) => {
        var custoUn = fGetNumber(item.item.vUnCom);
        var multiplicador = item.ingrediente.multiplicadorFornecedor || 1;
        return Number((custoUn / multiplicador).toFixed(2));
    }


    if(message.length > 0){
        return(
            <div className={styles['container-xml']}>
               <b>{message}</b>
            </div>
        )
    }
    return(
        <div className={styles.container}>

            <div style={{padding: '10px', marginBottom: '90px'}}>
            <table className={'table'}>
                <thead>
                    <tr>
                        <th style={{width: '30%'}}>Item XML</th>
                        <th style={{width: '30%'}}>Ingrediente Local</th>
                        <th style={{width: '10%'}}>Custo Un.</th>
                        <th style={{width: '10%'}}>Multiplicador</th>
                        <th style={{width: '10%'}}>Quantidade</th>
                        <th style={{width: '10%'}}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {ingredientes.map((produto, index) => {
                        return(
                            <tr>
                                <td>{produto.item.cProd} - {produto.item.xProd}</td>
                                <td>
                                    {produto.ingrediente?.nome ? <>
                                        {produto.ingrediente.id} -  {produto.ingrediente.nome}
                                    </> : <>
                                     <CustomButton typeButton={'main'} onClick={() => {
                                        setIngredienteModal(index)
                                     }}>
                                        Selecione o Ingrediente no sistema
                                     </CustomButton>
                                    </>}
                                    </td>
                                <td><InputGroup title={''} value={custoUnitario(produto)} onChange={(v) => {
                                    onLeave(index, v.target.value, "vUnCom")
                                }} /></td>
                                <td><InputGroup title={''} value={produto.ingrediente?.multiplicadorFornecedor} onChange={(v) => {
                                    onLeave(index, v.target.value, "multiplicadorFornecedor")
                                }} /></td>
                                <td><InputGroup title={''} value={produto.item.qCom} onChange={(v) => {
                                    onLeave(index, v.target.value, "qCom")
                                }} /></td>
                                <td>{(Number(produto.item.qCom) || 0) * (Number(produto.ingrediente?.multiplicadorFornecedor) || 1)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            </div>
            <div className={styles.footer}>
                <DataItem title={'Ingredientes'} value={quantidadeItens()}/>
                <DataItem title={'Valor Total'} value={valorItens()}/>
                <CustomButton className={styles.btn} typeButton={'main'} onClick={onSubmit}>Enviar lançamento</CustomButton>
            </div>
            {ingredienteModal >= 0 && <SelectIngredienteModal isOpen={ingredienteModal >= 0} selectedId={0} setClose={(v) => {
                      if(v){
                         selectProduto(v);
                      }else{
                        setIngredienteModal(-1);

                      }
                      
            }}/>}
        </div>
    )
}
const DataItem = ({title, value}) => {
    return(
        <div className={styles.item}>
            <label className={styles.itemTitle}>{title}</label>
            <label className={styles.itemValue}>{value}</label>
        </div>
    )
}