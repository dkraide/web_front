import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import BaseModal from "../../Base/Index";
import IUsuarioCaixa from "@/interfaces/IUsuarioCaixa";

interface props {
    isOpen: boolean
    classeId: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

// Agrupamento das permissões só pra organizar visualmente o form.
const GRUPOS_PERMISSOES: { titulo: string, campos: (keyof IUsuarioCaixa)[] }[] = [
    {
        titulo: 'Acesso a menus',
        campos: [
            'menuSAT', 'menuEmpresa', 'menuRelatorio', 'menuTributacao',
            'menuProduto', 'menuPromocao', 'menuCaixa', 'menuHistorico',
        ],
    },
    {
        titulo: 'Produto',
        campos: [
            'cadastroProduto', 'removeProduto', 'materiaPrima',
            'visualizarEstoquePesquisa', 'visualizaLucroProduto',
        ],
    },
    {
        titulo: 'Venda / Caixa',
        campos: [
            'vendaDiaria', 'cancelarVenda', 'lancarRemessaCompra',
            'valorFechamento', 'alteraValorCarrinho', 'alteraDescontoVenda',
            'editarComanda', 'removeItemComanda', 'finalizaVendaSemEstoque',
            'imprimeProdutoFechamento', 'visualizaVendasAntigas',
            'visualizarVendaCaixa', 'impFechamentoCanceladas',
            'permitePausarVenda',
        ],
    },
]

const LABELS: Partial<Record<keyof IUsuarioCaixa, string>> = {
    menuSAT: 'Menu SAT',
    menuEmpresa: 'Menu Empresa',
    menuRelatorio: 'Menu Relatório',
    menuTributacao: 'Menu Tributação',
    menuProduto: 'Menu Produto',
    menuPromocao: 'Menu Promoção',
    menuCaixa: 'Menu Caixa',
    menuHistorico: 'Menu Histórico',
    cadastroProduto: 'Cadastro de produto',
    removeProduto: 'Remove produto',
    materiaPrima: 'Matéria prima',
    visualizarEstoquePesquisa: 'Ver estoque na pesquisa',
    visualizaLucroProduto: 'Visualiza lucro do produto',
    vendaDiaria: 'Venda diária',
    cancelarVenda: 'Cancelar venda',
    lancarRemessaCompra: 'Lançar remessa de compra',
    valorFechamento: 'Valor de fechamento',
    alteraValorCarrinho: 'Altera valor do carrinho',
    alteraDescontoVenda: 'Altera desconto da venda',
    editarComanda: 'Editar comanda',
    removeItemComanda: 'Remove item da comanda',
    finalizaVendaSemEstoque: 'Finaliza venda sem estoque',
    imprimeProdutoFechamento: 'Impr. produto fechamento',
    visualizaVendasAntigas: 'Visualiza vendas antigas',
    visualizarVendaCaixa: 'Visualizar venda no caixa',
    impFechamentoCanceladas: 'Impr. fechamento canc.',
    permitePausarVenda: 'Permite pausar venda',
}

export default function UsuarioCaixaForm({ user, isOpen, classeId, setClose, color }: props) {

    const {
        register,
        handleSubmit,
        formState: { errors } } =
        useForm();

    const [obj, setObj] = useState<IUsuarioCaixa>({} as IUsuarioCaixa)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (classeId > 0) {
            api.get(`/v2/Usuario/Select/${classeId}?empresaId=${user.empresaSelecionada}`)
                .then(({ data }: AxiosResponse<IUsuarioCaixa>) => {
                    setObj(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            setObj({ ...obj, id: 0 });
            setLoading(false);
        }
    }, []);

    const toggle = (campo: keyof IUsuarioCaixa, v: boolean) => {
        setObj(prev => ({ ...prev, [campo]: v }))
    }

    const onSubmit = async (data: any) => {
        const payload: IUsuarioCaixa = {
            ...obj,
            nome: data.nome,
            login: data.login,
            senha: data.senha,
            email: data.email,
            telefone: data.telefone,
            rg: data.rg,
            cpf: data.cpf,
            tipo: data.tipo,
        }

        setSending(true);

        if (payload.id > 0) {
            api.put(`/v2/Usuario/Update`, payload)
                .then(() => {
                    toast.success(`Usuario atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar Usuario. ${err.response?.data}`);
                })
                .finally(() => setSending(false));
        } else {
            payload.empresaId = user.empresaSelecionada;
            api.post(`/v2/Usuario/Create`, payload)
                .then(() => {
                    toast.success(`Usuario cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar Usuario. ${err.response?.data}`);
                })
                .finally(() => setSending(false));
        }
    }

    return (
        <BaseModal color={color} title={'Cadastro de Usuario'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.ucForm}>
                    <section className={styles.ucCard}>
                        <h5 className={styles.ucCardTitle}>Dados do usuário</h5>
                        <div className={styles.ucGridWide}>
                            <InputForm defaultValue={obj.nome} width={'100%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                            <InputForm defaultValue={obj.login} width={'100%'} title={'Usuario'} errors={errors} inputName={"login"} register={register} />
                            <InputForm defaultValue={obj.senha} width={'100%'} title={'Senha'} errors={errors} inputName={"senha"} register={register} />
                        </div>
                    </section>

                    {GRUPOS_PERMISSOES.map(grupo => (
                        <section className={styles.ucCard} key={grupo.titulo}>
                            <h5 className={styles.ucCardTitle}>{grupo.titulo}</h5>
                            <div className={styles.ucGridNarrow}>
                                {grupo.campos.map(campo => (
                                    <SelectSimNao
                                        key={campo}
                                        width={'100%'}
                                        title={LABELS[campo]}
                                        selected={obj[campo] as boolean}
                                        setSelected={(v) => toggle(campo, v)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className={styles.ucFooter}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}