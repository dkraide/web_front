import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
import ITributacao from "@/interfaces/ITributacao";
import { Button, InputGroup, Tab, Tabs, Form } from "react-bootstrap";
import { InputForm } from "@/components/ui/InputGroup";
import SelectStatus from "@/components/Selects/SelectStatus";
import IProduto from "@/interfaces/IProduto";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import SelectTributacao from "@/components/Selects/SelectTributacao";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import ICodBarras from "@/interfaces/ICodBarras";
import _ from "lodash";
import ITamanho from "@/interfaces/ITamanho";
import VinculeMateriaPrima from "../MateriaPrima/VinculaProduto";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import ITamanhoMateriaPrima from "@/interfaces/ITamanhoMateriaPrima";
import IProdutoMateriaPrima from "@/interfaces/IProdutoMateriaPrima";
import { fGetNumber } from "@/utils/functions";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function ProdutoForm({ user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [obj, setObj] = useState<IProduto>({} as IProduto)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false)
    const [modalMp, setModalMp] = useState(false)
    const [tamanho, setTamanho] = useState(0)

    useEffect(() => {
        if (id > 0) {
            api.get(`/Produto/Select?id=${id}`)
                .then(({ data }: AxiosResponse<IProduto>) => {
                    setObj(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            obj.id = 0;
            obj.status = true;
            setObj(obj);
            setValue("unidadeCompra", "UN");
            setValue("quantidadeMinima", "0");
            setValue("quantidade", "0");
            setValue("valor", "0");
            setValue("valorCompra", "0");
            api.get(`/Produto/NextCod?empresaId=${user.empresaSelecionada}`)
                .then(({ data }: AxiosResponse<number>) => {
                    setValue("cod", data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        obj.nome = data.nome;
        obj.unidadeCompra = data.unidadeCompra;
        obj.valor = fGetNumber(data.valor);
        obj.valorCompra = fGetNumber(data.valorCompra);
        obj.quantidadeMinima = fGetNumber(data.quantidadeMinima);
        obj.cod = data.cod;
        obj.codigoFornecedor= data.codigoFornecedor;
        obj.multiplicadorFornecedor = fGetNumber(data.multiplicadorFornecedor);
        
        if (obj.id > 0) {
            api.put(`Produto/UpdateProduct`, obj)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`objeto atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar objeto. ${err.response?.data}`);
                })

        } else {
            obj.empresaId = user.empresaSelecionada;
            api.post(`Produto/CreateProduto`, obj)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`objeto cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar objeto. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    function addCodigo() {
        var codigo = getValues("codigoBarras");
        if (!codigo || codigo.length == 0) {
            toast.error(`Informe um codigo para adicionar`);
            return;
        }
        if (!obj.codBarras) {
            obj.codBarras = [];
        }
        var ind = _.findIndex(obj.codBarras, o => o.codigo == codigo);
        if (ind >= 0) {
            toast.error(`Codigo ja adicionado.`);
            return;
        }
        obj.codBarras.push({
            codigo: codigo,
            idProduto: obj.idProduto,
            produtoId: obj.id,
            empresaId: obj.empresaId
        } as ICodBarras);
        setObj({ ...obj, codBarras: obj.codBarras });
        setValue("codigoBarras", "");
    }
    async function removeCodigo(index: number) {
        if(obj.codBarras[index].id > 0){
             var res = await api.delete(`/CodBarras/Delete?id=${obj.codBarras[index].id}`)
             .then((res: AxiosResponse) => {
                toast.success(`Codigo de barras excluido na nuvem`)
                    return true;
             }).catch((err: AxiosError) => {
                toast.error(`Erro ao excluir codigo na nuvem. ${err.message}`)
                    return false;
             })
             if(!res){
                return;
             }
        }
        obj.codBarras.splice(index, 1);
        setObj({ ...obj, codBarras: obj.codBarras });
    }
    function addTamanho() {
        var codigo = getValues<string>("codigoTamanho");
        if (!codigo || codigo.length == 0) {
            toast.error(`Informe um taamanho para adicionar`);
            return;
        }
        if (!obj.tamanhos) {
            obj.tamanhos = [];
        }
        var ind = _.findIndex(obj.tamanhos, o => o.nome.toLocaleUpperCase() == codigo.toUpperCase());
        if (ind >= 0) {
            toast.error(`Tamanho ja adicionado.`);
            return;
        }
        obj.tamanhos.push({
            nome: codigo,
            idProduto: obj.idProduto,
            produtoId: obj.id,
            empresaId: obj.empresaId
        } as ITamanho);
        setObj({ ...obj, codBarras: obj.codBarras });
        setValue("codigoBarras", "");
    }
    async function removeTamanho(index: number) {
        if(obj.tamanhos[index].id > 0){
            var res = await api.delete(`/Tamanho/Delete?id=${obj.tamanhos[index].id}`)
            .then((res: AxiosResponse) => {
               toast.success(`Tamanho excluido na nuvem`)
                   return true;
            }).catch((err: AxiosError) => {
               toast.error(`Erro ao excluir Tamanho na nuvem. ${err.response?.data}`)
                   return false;
            })
            if(!res){
               return;
            }
       }
        obj.tamanhos.splice(index, 1);
        setObj({ ...obj, codBarras: obj.codBarras });
    }
    function addMp(mp: IMateriaPrima, qntd: number, opc: boolean) {
        if (obj.tamanhos && obj.tamanhos.length > 0) {
            console.log('kkk');
            if (!obj.tamanhos[tamanho].materiaPrimas) {
                obj.tamanhos[tamanho].materiaPrimas = [];
            }
            obj.tamanhos[tamanho].materiaPrimas.push({
                id: 0,
                idMateriaPrima: mp.idMateriaPrima,
                idTamanhoMateriaPrima: 0,
                idTamanho: obj.tamanhos[tamanho].idTamanho,
                quantidadeMateriaPrima: qntd,
                opcional: opc,
                lastChange: new Date(),
                localCriacao: 'ONLINE',
                materiaPrima: mp,
                materiaPrimaId: mp.id,
                tamanhoId: obj.tamanhos[tamanho].id,
                empresaId: user.empresaSelecionada
            } as ITamanhoMateriaPrima);

            setObj({ ...obj, tamanhos: obj.tamanhos });
        } else {
            if (!obj.materiaPrimas) {
                obj.materiaPrimas = [];
            }
            obj.materiaPrimas.push({
                idProdutoMateriaPrima: 0,
                idProduto: obj.idProduto,
                idMateriaPrima: mp.idMateriaPrima,
                id: 0,
                quantidadeMateriaPrima: qntd,
                opcional: opc,
                lastChange: new Date(),
                localCriacao: 'ONLINE',
                materiaPrima: mp,
                produtoId: obj.id,
                materiaPrimaId: mp.id,
                empresaId: user.empresaSelecionada
            } as IProdutoMateriaPrima);
            setObj({ ...obj, materiaPrimas: obj.materiaPrimas });
        }
    }
    async function removeMateriaPrima(index: number) {
        if (obj.tamanhos && obj.tamanhos.length > 0) {
            var id =  obj.tamanhos[tamanho].materiaPrimas[index].id;
            if(id > 0){
                var res = await api.delete(`/Tamanho/DeleteMaterial?id=${id}`)
                .then((res: AxiosResponse) => {
                   toast.success(`Material desvinculo do tamanho na nuvem`)
                       return true;
                }).catch((err: AxiosError) => {
                   toast.error(`Erro ao desvincular material do Tamanho na nuvem. ${err.message}`)
                       return false;
                })
                if(!res){
                   return;
                }
           }
            obj.tamanhos[tamanho].materiaPrimas.splice(index, 1);
            setObj({ ...obj, tamanhos: obj.tamanhos });
        } else {
            var id =   obj.materiaPrimas[index].id;
            if(id > 0){
                var res = await api.delete(`/ProdutoMateriaPrima/Delete?id=${id}`)
                .then((res: AxiosResponse) => {
                   toast.success(`Materia prima excluida na nuvem`)
                       return true;
                }).catch((err: AxiosError) => {
                   toast.error(`Erro ao excluir materia prima. ${err.message}`)
                       return false;
                })
                if(!res){
                   return;
                }
           }
            obj.materiaPrimas.splice(index, 1);
            setObj({ ...obj, materiaPrimas: obj.materiaPrimas });
        }
    }
    function getMateriaPrima() {
        if (!obj.tamanhos || obj.tamanhos.length == 0) {
            return obj.materiaPrimas;
        } else {
            console.log(obj.tamanhos[tamanho])
            return obj.tamanhos[tamanho]?.materiaPrimas || [];
        }
    }
    return (
        <BaseModal  color={color} title={'Cadastro de Produto'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <Tabs
                        defaultActiveKey="produto"
                        id="uncontrolled-tab-example"
                        variant={'underline'}
                        justify={false}
                        fill
                    >
                        <Tab color={'red'} eventKey="produto" title="Produto">
                            <div className={styles.content}>
                                <InputForm defaultValue={obj.cod} width={'10%'} title={'Cod'} errors={errors} inputName={"cod"} register={register} />
                                <InputForm placeholder={'Nome do Produto'} defaultValue={obj.nome} width={'75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                                <SelectStatus width={'15%'} selected={obj.status} setSelected={(v) => { setObj({ ...obj, status: v }) }} />
                                <InputForm defaultValue={obj.unidadeCompra} maxLength={3} width={'15%'} title={'UN Medida'} errors={errors} inputName={"unidadeCompra"} register={register} />
                                <InputForm defaultValue={obj.valorCompra} width={'15%'} title={'Custo (R$)'} errors={errors} inputName={"valorCompra"} register={register} />
                                <InputForm defaultValue={obj.valor} width={'15%'} title={'Venda (R$)'} errors={errors} inputName={"valor"} register={register} />
                                <InputForm defaultValue={obj.quantidadeMinima} width={'15%'} title={'Estoque Min.'} errors={errors} inputName={"quantidadeMinima"} register={register} />
                                <InputForm defaultValue={obj.quantidade} width={'15%'} title={'Estoque Atual'} errors={errors} inputName={"quantidade"} register={register} />
                                <div style={{width: '100%', display: 'flex'}}>
                                <InputForm defaultValue={obj.codigoFornecedor} width={'15%'} title={'Cod. Fornecedor'} errors={errors} inputName={"codigoFornecedor"} register={register} />
                                <InputForm defaultValue={obj.multiplicadorFornecedor} width={'15%'} title={'Multiplicador'} errors={errors} inputName={"multiplicadorFornecedor"} register={register} />
                                </div>
                                <SelectClasseMaterial width={'49%'} selected={obj.classeMaterialId} setSelected={(v) => { setObj({ ...obj, classeMaterialId: v.id, idClasseMaterial: v.idClasseMaterial }) }} />
                                <SelectTributacao width={'49%'} selected={obj.tributacaoId} setSelected={(v) => { setObj({ ...obj, tributacaoId: v.id, idTributacao: v.idTributacao }) }} />
                                <div className={styles.codBarras}>
                                    <h5>Codigo de Barras</h5>
                                    <InputGroup className="mb-3">
                                        <Form.Control
                                            placeholder="Codigo de Barras"
                                            aria-label="Codigo de Barras"
                                            aria-describedby="basic-addon2"
                                            {...register('codigoBarras')}
                                        />
                                        <CustomButton style={{zIndex: 0,}} typeButton="dark" id="button-addon2" onClick={addCodigo}>
                                            Adicionar
                                        </CustomButton>
                                    </InputGroup>
                                    <div className={styles.codigos}>
                                        {(obj.codBarras && obj.codBarras.length > 0) && (
                                            obj.codBarras.map((c, index) => <div key={index} className={styles.codigoItem}>
                                                <a className={'btn btn-danger'} onClick={() => { removeCodigo(index) }}><FontAwesomeIcon icon={faTrash} /></a>
                                                <label>{c.codigo}</label>
                                            </div>)
                                        )}
                                    </div>

                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="materiaPrima" title="Materia Prima / Tamanho">
                            <div className="row">
                                <div className={"col-3"}>
                                    <h5>Tamanhos</h5>
                                    <InputGroup className="mb-3">
                                        <Form.Control
                                            placeholder="Tamanho"
                                            aria-describedby="basic-addon2"
                                            {...register('codigoTamanho')}
                                        />
                                        <Button variant="dark" id="button-addon2" onClick={addTamanho}>
                                            Adicionar
                                        </Button>
                                    </InputGroup>
                                    <div className={styles.codigos}>
                                        {(obj.tamanhos && obj.tamanhos.length > 0) && (
                                            obj.tamanhos.map((c, index) => <div
                                                key={index}
                                                className={tamanho == index ? styles.codigoItemSelected : styles.codigoItem}
                                                onClick={() => { setTamanho(index) }}>
                                                <a className={'btn btn-danger'} onClick={() => { removeTamanho(index) }}><FontAwesomeIcon icon={faTrash} /></a>
                                                <label>{c.nome}</label>
                                            </div>)
                                        )}
                                    </div>
                                </div>
                                <div className="col-9">
                                    <div className="mb-2">
                                        <CustomButton typeButton={'dark'} onClick={() => { setModalMp(!modalMp) }}>Adicionar Materia</CustomButton>
                                    </div>
                                    {((obj.tamanhos && obj.tamanhos.length > 0) || (obj.materiaPrimas && obj.materiaPrimas.length > 0)) && (
                                        getMateriaPrima().map((c, index) => <div
                                            key={index}
                                            className={styles.codigoItem}
                                            onClick={() => { setTamanho(index) }}>
                                            <a className={'btn btn-danger'} onClick={() => { removeMateriaPrima(index) }}><FontAwesomeIcon icon={faTrash} /></a>
                                            <label>{c.materiaPrima.nome} {c.quantidadeMateriaPrima && ` x ${c.quantidadeMateriaPrima.toFixed(2)}`}</label>
                                        </div>)
                                    )}
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>

                </div>
            )}
            {modalMp && <VinculeMateriaPrima user={user} isOpen={modalMp} setClose={(res) => {
                if (res) {
                    addMp(res.mp, res.qntd, res.opc);
                }
                setModalMp(false);

            }} />}
        </BaseModal>
    )
}