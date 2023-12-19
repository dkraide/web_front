import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { api } from '@/services/apiClient';
import { InputForm } from '@/components/ui/InputGroup';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { fGetNumber } from '@/utils/functions';
import { AxiosError, AxiosResponse } from 'axios';
import IProduto from '@/interfaces/IProduto';
import AddCarrinho from '@/components/PDV/AddCarrinho';
import IVendaProduto from '@/interfaces/IVendaProduto';
import IVenda from '@/interfaces/IVenda';
import Carrinho from '@/components/PDV/Carrinho';
import Totais from '@/components/PDV/Totais';
import FinalizarVenda from '@/components/PDV/FinalizarVenda';
import Atalhos from '@/components/PDV/Atalhos';
import IMovimentoCaixa from '@/interfaces/IMovimentoCaixa';
import Usuario from '@/components/PDV/Usuario';
import Caixa from '@/components/PDV/Caixa';
import LoadingModal from '@/components/Modals/LoadingModal';
import BoxPdvCaixa from '@/components/PDV/BoxPdvCaixa';
import Vendas from '@/components/PDV/Vendas';
import Sangrias from '@/components/PDV/Sangrias';


export default function Pdv() {

    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const [venda, setVenda] = useState<IVenda>({} as IVenda)
    const [finalizar, setFinalizar] = useState(false)
    const [caixa, setCaixa] = useState<IMovimentoCaixa | undefined>({} as IMovimentoCaixa)
    const [openCaixa, setOpenCaixa] = useState(false);
    const [openVenda, setOpenVenda] = useState(false);
    const [openSangria, setOpenSangria] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();

    useEffect(() => {
        loadData();
    }, []);


    async function loadData() {
        setLoading(true);
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api.get(`/MovimentoCaixa/SelectOpen?UsuarioCaixaId=${user?.usuarioCaixa?.id || u.usuarioCaixa?.id}`)
            .then(({ data }: AxiosResponse) => {
                if (data == null) {
                    setCaixa(undefined);
                } else {
                    setCaixa(data);
                }

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao selecionar caixa`);
            });
        setLoading(false);

    }
    async function addCarrinho(produto: IVendaProduto) {
        if (!venda.empresaId) {
            venda.empresaId = user.empresaSelecionada;
        }
        var model = {
            venda,
            produto
        }
        return await api.post(`/PDV/AddCarrinho`, model)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setVenda(data);
                return true;
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao adicionar no carrinho. ${err.response?.data || err.message}`);
                return false;
            })

    }
    async function RemoveCarrinho(indexProduto: number) {
        if (!venda.empresaId) {
            venda.empresaId = user.empresaSelecionada;
        }
        var model = {
            venda,
            indexProduto
        }
        setLoading(true);
        await api.post(`/PDV/RemoveCarrinho`, model)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setVenda(data);
                toast.success('Item removido com sucesso');
                return true;
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao rtemover do carrinho. ${err.response?.data || err.message}`);
                return false;
            })
        setLoading(false);
    }
    async function EditCarrinho(indexProduto: number, produto: IVendaProduto) {
        if (!venda.empresaId) {
            venda.empresaId = user.empresaSelecionada;
        }
        var model = {
            venda,
            produto,
            indexProduto
        }
        return await api.post(`/PDV/EditCarrinho`, model)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setVenda(data);
                toast.success('Sucesso ao editar item.');
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao editar no carrinho. ${err.response?.data || err.message}`);
            })
    }

    function onKeyEvent(e) {
        switch (e.key.toLowerCase()) {
            case "f1":
                setOpenCaixa(true);
                e.preventDefault();
                break;
            case "f6":
                setOpenVenda(true);
                e.preventDefault();
                break;
            case "f7":
                setOpenSangria(true);
                e.preventDefault();
                break;
        }
    }
    if (!user) {
        return;
    }

    return (
        <div className={styles.container}>
            <div style={{ width: '100%', height: '15%' }}>
                <AddCarrinho onKeyEvent={onKeyEvent} finalizar={finalizar} onFinalizar={() => {
                    if (venda?.produtos?.length > 0) {
                        setFinalizar(true)
                    } else {
                        toast.error(`Carrinho vazio.`);
                    }
                }} onAddProduto={addCarrinho} user={user} />
            </div>
            <div style={{ width: '70%', height: '83%' }}>
                <Carrinho onEditCarrinho={EditCarrinho} onRemoveCarrinho={RemoveCarrinho} produtos={venda?.produtos} />
            </div>
            <div style={{ width: '28%', height: '83%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '10px' }}>
                    <Totais venda={venda} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <Atalhos onKey={onKeyEvent} venda={venda} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <BoxPdvCaixa caixa={caixa} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <Usuario usuario={user} />
                </div>
            </div>
            {finalizar && <FinalizarVenda usuario={user.usuarioCaixa} caixa={caixa} venda={venda} isOpen={finalizar} setClose={(v) => {
                if (v) {
                    setVenda({} as IVenda);
                }
                setFinalizar(false);
            }} />}


            {(!caixa.id || openCaixa) && <Caixa usuarioCaixa={user.usuarioCaixa} caixa={caixa} isOpen={(!caixa.id || openCaixa)} setClose={(v) => {

                if (!caixa.id && v != undefined) {
                    setCaixa(v);
                    setOpenCaixa(false);
                    return;
                }
                if (v.id && v.status) {
                    window.location.reload();
                    return;
                }
                if (v.id) {
                    setOpenCaixa(false);
                    return;
                }
            }} />}
            {(caixa || openVenda) && <Vendas usuario={user.usuarioCaixa} caixa={caixa} isOpen={(!caixa || openVenda)} setClose={(v) => {
                setOpenVenda(false);
            }} />}
            {(caixa || openSangria) && <Sangrias usuario={user.usuarioCaixa} caixa={caixa} isOpen={(!caixa || openSangria)} setClose={(v) => {
                setOpenSangria(false);
            }} />}
            {loading && <LoadingModal isOpen={loading} setClose={() => { }} />}
        </div>
    )
}