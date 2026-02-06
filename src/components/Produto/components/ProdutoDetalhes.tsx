import { Controller } from 'react-hook-form';
import { isMobile } from 'react-device-detect';
import KRDInput from '@/components/ui/KRDInput';
import SelectStatus from '@/components/Selects/SelectStatus';
import SelectSimNao from '@/components/Selects/SelectSimNao';
import SelectTributacao from '@/components/Selects/SelectTributacao';
import SelectClasseMaterial from '@/components/Selects/SelectClasseMaterial';
import ImageUpload from './ImageUpload';
import CodigoBarrasList from './CodigoBarrasList';
import styles from '../styles.module.scss';

interface ProdutoDetalhesProps {
    control: any;
    errors: any;
    register: any;
    setValue: any;
    produto: any;
    imagePreview?: string | null;
    onImageChange: (file: File) => void;
    onAddCodigo: (codigo: string) => void;
    onRemoveCodigo: (index: number) => void;
}

export default function ProdutoDetalhes({
    control,
    errors,
    register,
    setValue,
    produto,
    imagePreview,
    onImageChange,
    onAddCodigo,
    onRemoveCodigo,
}: ProdutoDetalhesProps) {
    return (
        <div className={styles.row}>
            <ImageUpload 
                currentImage={produto.localPath} 
                imagePreview={imagePreview}
                onImageChange={onImageChange} 
            />

            <div className={styles.row} style={{ width: isMobile ? '100%' : '75%' }}>
                <KRDInput
                    width="10%"
                    label="Cod"
                    name="cod"
                    control={control}
                    error={errors.cod?.message?.toString()}
                />
                <Controller
                    name="status"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                        <SelectStatus width="15%" selected={field.value} setSelected={field.onChange} />
                    )}
                />
                <KRDInput
                    width="70%"
                    label="Nome"
                    name="nome"
                    control={control}
                    error={errors.nome?.message?.toString()}
                />
                <KRDInput
                    width="100%"
                    label="Descrição"
                    name="descricao"
                    control={control}
                    error={errors.descricao?.message?.toString()}
                />
                <KRDInput
                    width="15%"
                    label="UN Medida"
                    name="unidadeCompra"
                    control={control}
                    error={errors.unidadeCompra?.message?.toString()}
                />
                <KRDInput
                    width="15%"
                    label="Custo (R$)"
                    name="valorCompra"
                    control={control}
                    error={errors.valorCompra?.message?.toString()}
                />
                <KRDInput
                    width="15%"
                    label="Venda (R$)"
                    name="valor"
                    control={control}
                    error={errors.valor?.message?.toString()}
                />
                <KRDInput
                    width="15%"
                    label="Estoque Min."
                    name="quantidadeMinima"
                    control={control}
                    error={errors.quantidadeMinima?.message?.toString()}
                />
                <Controller
                    name="bloqueiaEstoque"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                        <SelectSimNao
                            title="Bloqueia Estoque?"
                            width="15%"
                            selected={field.value}
                            setSelected={field.onChange}
                        />
                    )}
                />
                <KRDInput
                    width="15%"
                    label="Estoque Atual"
                    name="quantidade"
                    control={control}
                    error={errors.quantidade?.message?.toString()}
                />
            </div>

            <Controller
                name="tributacaoId"
                control={control}
                render={({ field }) => (
                    <SelectTributacao
                        error={errors.tributacaoId?.message?.toString()}
                        width="50%"
                        selected={Number(field.value ?? 0)}
                        setSelected={(v) => {
                            field.onChange(v.id);
                            setValue('idTributacao', v.idTributacao);
                        }}
                    />
                )}
            />
            <Controller
                name="classeMaterialId"
                control={control}
                render={({ field }) => (
                    <SelectClasseMaterial
                        error={errors.classeMaterialId?.message?.toString()}
                        width="45%"
                        selected={Number(field.value ?? 0)}
                        setSelected={(v) => {
                            field.onChange(v.id);
                            setValue('idClasseMaterial', v.idClasseMaterial);
                        }}
                    />
                )}
            />

            <div style={{ width: '100%', marginBottom: 10 }}>
                <hr />
                <b>Campos para importar de XML</b>
            </div>
            <KRDInput
                width="15%"
                label="Codigo Fornecedor"
                name="codigoFornecedor"
                control={control}
                error={errors.codigoFornecedor?.message?.toString()}
            />
            <KRDInput
                width="15%"
                label="Multiplciador Fornecedor"
                name="multiplicadorFornecedor"
                control={control}
                error={errors.multiplicadorFornecedor?.message?.toString()}
            />
            <div style={{ width: '65%' }} />

            <CodigoBarrasList
                codigos={produto.codBarras}
                onAdd={onAddCodigo}
                onRemove={onRemoveCodigo}
                register={register}
            />
        </div>
    );
}