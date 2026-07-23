import { Tab, Tabs } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { api } from '@/services/apiClient';
import IGrupoAdicional from '@/interfaces/IGrupoAdicional';
import IProdutoGrupoAdicional from '@/interfaces/IProdutoGrupoAdicional';
import CustomButton from '@/components/ui/Buttons';
import VinculeMateriaPrima from '@/components/Modals/MateriaPrima/VinculaProduto';
import { productSchema } from '@/schemas/ProductSchema';
import { useProdutoData } from './hooks/useProdutoData';
import { useCodigoBarras } from './hooks/useCodigoBarras';
import { useMateriaPrima } from './hooks/useMateriaPrima';
import { useGrupoAdicionais } from './hooks/useGrupoAdicionais';
import { useImageUpload } from './hooks/useImageUpload';
import ProdutoDetalhes from './components/ProdutoDetalhes';
import ProdutoMenuDigital from './components/ProdutoMenuDigital';
import ProdutoGrupos from './components/ProdutoGrupos';
import styles from './styles.module.scss';
import SelectProdutoGrupo from '../Modals/Produto/SelectProdutoGrupo';

export default function ProdutoItem() {
    const router = useRouter();
    const { produto, setProduto, user, loading, setLoading, loadCod } = useProdutoData();
    const [modalSelectGrupo, setModalSelectGrupo] = useState(false);
    const [tipoCal, setTipoCal] = useState('Cal');
    const [modalMp, setModalMp] = useState(false);

    const { imagePreview, handleImageChange, uploadImagemAsync, hasNewImage } = useImageUpload();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            valor: 0,
            unidadeCompra: 'UN',
            status: true,
            isAlcoholic: false,
            bloqueiaEstoque: false,
            quantidade: 0,
            quantidadeMinima: 0,
            valorCompra: 0,
            valorKeeta: 0,
            multiplicadorFornecedor: 1,
            posicao: 0,
            nome: '',
            descricaoNutricional: '',
            descricao: '',
            codigoFornecedor: ''
        },
    });

    const { addCodigo, removeCodigo } = useCodigoBarras(produto, setProduto);
    const { addMp, removeMateriaPrima } = useMateriaPrima(produto, setProduto, user);
    const { addOrUpdateGrupo, removeGrupo } = useGrupoAdicionais(produto, setProduto);

    useEffect(() => {
        if (!produto || loading) {
            return;
        }
        if (produto?.id) {
            let cal = '', tipoCal = '';
            if (produto.calories?.includes(' ')) {
                var cls = produto.calories.split(' ');
                cal = cls[0];
                setTipoCal(cls[1]);
            }
            reset({ ...produto, calories: cal });
        } else {
            loadCod().then((c) => {
                setValue('cod', c.toString());
            });
        }
    }, [produto, loading]);

    // Upload de imagem de item de grupo adicional.
    // OBS: os itens agora pertencem ao GrupoAdicional compartilhado, não mais
    // ao vínculo do produto. Esse fluxo idealmente deveria acontecer na tela
    // de gestão do Grupo Adicional, e não aqui. Mantido por compatibilidade
    // enquanto essa tela não existe no front — ver observação no chat.
    const uploadImagemItemGrupoAsync = async (
        temporaryImagem: string,
        grupoAdicionalItemId: string,
        empresaId: number
    ): Promise<string | null> => {
        try {
            const [meta, base64Data] = temporaryImagem.split(',');
            const mimeType = meta.match(/:(.*?);/)[1];
            const byteCharacters = atob(base64Data);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], `item_${grupoAdicionalItemId}.${mimeType.split('/')[1]}`, { type: mimeType });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('id', grupoAdicionalItemId);
            formData.append('empresaId', empresaId.toString());

            const { data } = await api.post(`v2/grupoadicionalitem/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data?.url ?? data?.localPath ?? null;
        } catch (err) {
            toast.error('Erro ao fazer upload da imagem do item');
            return null;
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);

        const updatedProduto = {
            ...produto,
            aliqFCPFornecedor: 0,
            aliqICMSFornecedor: 0,
            aliqICMSSTFornecedor: 0,
            aliqMVAFornecedor: 0,
            bloqueiaEstoque: data.bloqueiaEstoque,
            calories: `${data.calories} ${tipoCal}`,
            classeMaterialId: data.classeMaterialId,
            cod: data.cod,
            codigoFornecedor: data.codigoFornecedor,
            descricao: data.descricao,
            descricaoNutricional: data.descricaoNutricional,
            idClasseMaterial: data.idClasseMaterial,
            idTributacao: data.idTributacao,
            isAlcoholic: data.isAlcoholic,
            isConferencia: data.isConferencia,
            multiplicadorFornecedor: data.multiplicadorFornecedor,
            nome: data.nome,
            posicao: data.posicao,
            quantidadeMinima: data.quantidadeMinima,
            serving: data.serving,
            status: data.status,
            tributacaoId: data.tributacaoId,
            unidadeCompra: data.unidadeCompra,
            valor: data.valor,
            valorCompra: data.valorCompra,
            valorKeeta: data.valorKeeta,
            visivelMenu: data.visivelMenu,
        };

        try {
            let produtoId = produto.id;
            const isEdicao = !!produto.id && produto.id > 0;

            // Criar ou atualizar produto
            if (!isEdicao) {
                updatedProduto.tipo = 'SIMPLES';
                updatedProduto.status = true;
                updatedProduto.empresaId = user.empresaSelecionada;
                const { data: novoProduto } = await api.post(`/v2/Produto?empresaId=${user.empresaSelecionada}`, updatedProduto);
                produtoId = novoProduto.id;
                toast.success('Produto criado com sucesso!');
            } else {
                await api.put(`/v2/Produto?empresaId=${user.empresaSelecionada}`, updatedProduto);
                toast.success('Produto atualizado com sucesso!');
            }

            // Upload da imagem principal se houver uma nova
            if (hasNewImage && produtoId) {
                const newLocalPath = await uploadImagemAsync(produtoId);
                if (newLocalPath) {
                    setProduto({ ...updatedProduto, id: produtoId, localPath: newLocalPath });
                } else {
                    setProduto({ ...updatedProduto, id: produtoId });
                    setLoading(false);
                    return;
                }
            }

            // Upload de imagens dos itens de grupo que tiverem temporaryImage
            if (produto.grupoAdicionais?.length) {
                for (const vinculo of produto.grupoAdicionais) {
                    const itens = vinculo.grupoAdicional?.itens;
                    if (!itens?.length) continue;
                    for (const item of itens) {
                        if (!item.temporaryImage) continue;
                        const newUrl = await uploadImagemItemGrupoAsync(item.temporaryImage, item.id, user.empresaSelecionada);
                        if (newUrl) {
                            item.localPath = newUrl;
                            item.temporaryImage = undefined;
                        }
                    }
                }
            }

            router.push('/produto');

        } catch (err) {
            toast.error('Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    const handleVincularGrupo = (grupoSelecionado?: IGrupoAdicional) => {
        setModalSelectGrupo(false);
        if (!grupoSelecionado) return;

        // Evita vincular o mesmo grupo duas vezes
        const jaVinculado = produto.grupoAdicionais?.some(
            (v) => v.grupoAdicionalId
             === grupoSelecionado.id
        );
        if (jaVinculado) {
            toast.warn('Esse grupo já está vinculado ao produto.');
            return;
        }

        const vinculo: IProdutoGrupoAdicional = {
            id: 0,
            idProdutoGrupoAdicional: 0,
            idProduto: produto.idProduto,
            produtoId: produto.id,
            idGrupoAdicional: grupoSelecionado.idGrupoAdicional,
            grupoAdicionalId: grupoSelecionado.id,
            empresaId: user.empresaSelecionada,
            lastChange: new Date(),
            needChange: true,
            grupoAdicional: grupoSelecionado,
        };

        addOrUpdateGrupo(vinculo, -1);
    };

    const handleEditGrupo = (vinculo: IProdutoGrupoAdicional) => {
        // Edição do conteúdo do grupo (nome, min/max, itens) agora é feita na
        // tela própria do Grupo Adicional, já que ele é compartilhado entre produtos.
        const id = vinculo.grupoAdicionalId ?? vinculo.grupoAdicional?.id;
        if (id) {
            router.push(`/grupos-adicionais/${id}`);
        }
    };

    const handleAddCodigo = (codigoBarras: string) => {
        if (addCodigo(codigoBarras)) {
            setValue('codigoBarras', '');
        }
    };

    if (!produto) {
        return <></>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <h3>Cadastro de produto</h3>
                <Tabs defaultActiveKey="produto" id="uncontrolled-tab-example" variant="underline" justify={false} fill>
                    <Tab eventKey="produto" title="Detalhes">
                        <ProdutoDetalhes
                            control={control}
                            errors={errors}
                            register={register}
                            setValue={setValue}
                            produto={produto}
                            imagePreview={imagePreview}
                            onImageChange={handleImageChange}
                            onAddCodigo={handleAddCodigo}
                            onRemoveCodigo={removeCodigo}
                        />
                    </Tab>

                    <Tab eventKey="menuDigital" title="Menu Digital">
                        <ProdutoMenuDigital
                            control={control}
                            errors={errors}
                            produto={produto}
                            setProduto={setProduto}
                            tipoCal={tipoCal}
                            setTipoCal={setTipoCal}
                        />
                    </Tab>

                    <Tab className={styles.tab} eventKey="grupos" title="Grupos de Adicionais">
                        <ProdutoGrupos
                            materiaPrimas={produto.materiaPrimas}
                            grupoAdicionais={produto.grupoAdicionais}
                            onAddMateriaPrima={() => setModalMp(true)}
                            onRemoveMateriaPrima={removeMateriaPrima}
                            onVincularGrupo={() => setModalSelectGrupo(true)}
                            onEditGrupo={handleEditGrupo}
                            onDeleteGrupo={removeGrupo}
                        />
                    </Tab>
                </Tabs>
            </div>

            <div style={{ width: '100%', marginTop: 20 }} className={styles.buttons}>
                <CustomButton disabled={loading} loading={loading} onClick={handleSubmit(onSubmit)}>
                    Cadastrar
                </CustomButton>
            </div>

            {modalMp && (
                <VinculeMateriaPrima
                    user={user}
                    isOpen={modalMp}
                    setClose={(res) => {
                        if (res) {
                            addMp(res.mp, res.qntd, res.opcional);
                        }
                        setModalMp(false);
                    }}
                />
            )}

            {modalSelectGrupo && (
                <SelectProdutoGrupo
                    empresa={user?.empresaSelecionada}
                    setClose={handleVincularGrupo}
                />
            )}
        </div>
    );
}