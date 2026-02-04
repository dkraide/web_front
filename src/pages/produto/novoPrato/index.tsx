import { Tab, Tabs } from 'react-bootstrap';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import { InputGroup } from '@/components/ui/InputGroup';
import IProduto from '@/interfaces/IProduto';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Switch from "react-switch";
import { fGetNumber } from '@/utils/functions';
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial';
import SelectTributacao from '@/components/Selects/SelectTributacao';
import { api } from '@/services/apiClient';
import IUsuario from '@/interfaces/IUsuario';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import NovoGrupo from '@/components/Modals/Produto/prato/NovoGrupo';

export default function NovoPrato() {
    const [prato, setPrato] = useState<IProduto>();
    const [user, setUser] = useState<IUsuario>();
    const { getUser } = useContext(AuthContext);
    const [modalGrupo, setModalGrupo] = useState(false);
    const [indexGrupo, setIndexGrupo] = useState<number>(-1)
    const router = useRouter();
    const { id } = router.query;

    const loadUser = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
            return u;
        } else {
            return user;
        }
    }

    const loadCod = async () => {
        var u = await loadUser();
        var cod = await api.get(`/Produto/NextCod?empresaId=${u.empresaSelecionada}`)
            .then(({ data }: AxiosResponse<number>) => {
                return data;
            })
            .catch((err) => {
                toast.error(`Erro ao buscar codigo. ${err.message}`);
                return 0;
            });
        return cod;
    }
    useEffect(() => {
        if (!router.isReady) {
            return;
        }
        if (!id) {
            const inicializarPrato = (): IProduto => ({
                bloqueiaEstoque: false,
                idProduto: 0,
                id: 0,
                nome: '',
                valorCompra: 0,
                cod: 0,
                valor: 0,
                quantidade: 0,
                status: true,
                unidadeCompra: '',
                tributacao: {} as any, // Ajuste conforme sua implementação de ITributacao
                idTributacao: 0,
                materiaPrimas: [],
                tamanhos: [],
                fornecedores: [],
                grupoAdicionais: [],
                codBarras: [],
                classeMaterial: {} as any, // Ajuste conforme sua implementação de IClasseMaterial
                idClasseMaterial: 0,
                quantidadeMinima: 0,
                empresaId: 0,
                classeMaterialId: 0,
                tributacaoId: 0,
                lastChange: new Date(),
                localCriacao: '',
                custoTotal: 0,
                codigoFornecedor: '',
                multiplicadorFornecedor: 0,
                localPath: '',
                getCustoMateriaPrima: false,
                ultimaConferencia: new Date(),
                valorUnitarioSemImposto: 0,
                aliqICMSFornecedor: 0,
                aliqICMSSTFornecedor: 0,
                aliqFCPFornecedor: 0,
                aliqMVAFornecedor: 0,
                tipo: 'PRATO',
                posicao: 0,
                visivelMenu: false,
                promocoes: [],
                descricao: '',
                isConferencia: false,
                imagem: undefined,
            });
            setTimeout(async () => {
                var cod = await loadCod();
                var p = inicializarPrato();
                p.cod = cod;
                setPrato(p);
                loadCod();
            })
        } else {
            api.get(`/Produto/Select?id=${id}`).then(({ data }) => {
                setPrato(data);
            });
        }

    }, [router.isReady]);
    const onSubmit = async () => {

        if (!prato.id || prato.id <= 0) {
            prato.tipo = "PRATO";
            prato.status = true;
            prato.empresaId = user.empresaSelecionada;
            await api.post(`/Produto/Create`, prato).then(({ data }) => {
                toast.success(`sucesso rapaz`);
            }).catch((err) => {
                toast.error(`ERRO rapaz`);
            })

        } else {
            await api.put(`/Produto/UpdateProduct`, prato).then(({ data }) => {
                toast.success(`sucesso rapaz`);
            }).catch((err) => {
                toast.error(`ERRO rapaz`);
            })
        }
    }

    const handleNewGrupo = (response?: IProdutoGrupo) => {
        setModalGrupo(false);
        if (response) {
            if (indexGrupo < 0) {
                prato.grupoAdicionais.push(response);

            } else {
                prato.grupoAdicionais[indexGrupo] = response;
            }
            setPrato({ ...prato });
        }

    }

    if (!prato) {
        return <></>;
    }

    const ItemGrupo = (grupo: IProdutoGrupo, index: number) => {
        const handleEditGrupo = () => {
                   setIndexGrupo(index);
                   setModalGrupo(true);
        }
        return (
            <div onClick={handleEditGrupo} className={styles.grupo}>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'row' }}>
                    <div style={{width: '70%'}}>
                        <h5>{grupo.descricao}</h5>
                        <b>Min: {grupo.minimo} Max: {grupo.maximo}</b>
                    </div>
                    <div style={{width: '30%', display: 'flex', flexDirection: 'column'}}>
                        <span>{grupo.status ? 'Ativo' : 'Pausado'}</span>
                        <span>{grupo.itens?.length ?? 0} itens</span>
                    </div>
                </div>
                <div style={{ width: '10%' }}>
                    <CustomButton><FontAwesomeIcon icon={faTrash} /></CustomButton>
                </div>
            </div>
        )
    }


    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <h3>Novo Prato</h3>
                <Tabs defaultActiveKey="produto" id="uncontrolled-tab-example" variant={'underline'} justify={false} fill>
                    <Tab eventKey="produto" title="Detalhes">
                        <div className={styles.row}>
                            <InputGroup width={'10%'} title={'Cod'} value={prato.cod} onChange={((v) => { setPrato({ ...prato, cod: fGetNumber(v.currentTarget.value) }) })} />
                            <InputGroup width={'80%'} title={'Nome'} value={prato.nome} onChange={((v) => { setPrato({ ...prato, nome: v.currentTarget.value }) })} />
                            <div style={{ width: '10%', display: 'flex', justifyContent: 'flex-end' }}>
                                <Switch onColor={'#fc4f6b'} onChange={(e) => { setPrato({ ...prato, status: e }) }} checked={prato.status} />
                            </div>
                            <SelectClasseMaterial selected={prato.classeMaterialId} setSelected={(v) => { setPrato({ ...prato, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial }) }} />
                            <SelectTributacao selected={prato.tributacaoId} setSelected={(v) => { setPrato({ ...prato, tributacaoId: v.id, idTributacao: v.idTributacao }) }} />
                        </div>
                    </Tab>
                    <Tab className={styles.tab} eventKey="grupos" title="Grupos de Adicionais">
                        <div className={styles.contentTab}>
                            <div className={styles.buttons}>
                                <CustomButton onClick={() => { setIndexGrupo(-1);  setModalGrupo(true) }}>Novo grupo de complementos</CustomButton>
                            </div>
                            <hr />
                            {prato.grupoAdicionais?.map((grupo, index) => ItemGrupo(grupo, index))}
                        </div>
                    </Tab>
                </Tabs>
            </div>
            <div className={styles.buttons}>
                <CustomButton onClick={onSubmit}>Cadastrar</CustomButton>

            </div>
            {modalGrupo && <NovoGrupo isOpen={modalGrupo} grupoEditado={indexGrupo < 0 ? undefined : prato.grupoAdicionais[indexGrupo] } setClose={handleNewGrupo} />}
        </div>
    );
}
