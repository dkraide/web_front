import { Controller } from 'react-hook-form';
import KRDInput from '@/components/ui/KRDInput';
import SelectStatus from '@/components/Selects/SelectStatus';
import SelectSimNao from '@/components/Selects/SelectSimNao';
import SelectNumber from '@/components/Selects/SelectNumber';
import SelectTipoCaloria from '@/components/Selects/SelectTipoCaloria';
import SuitableDiet from './SuitableDiet';
import Allergens from './Allergens';
import styles from '../styles.module.scss';

interface ProdutoMenuDigitalProps {
    control: any;
    errors: any;
    produto: any;
    setProduto: (produto: any) => void;
    tipoCal: string;
    setTipoCal: (value: string) => void;
}

export default function ProdutoMenuDigital({
    control,
    errors,
    produto,
    setProduto,
    tipoCal,
    setTipoCal,
}: ProdutoMenuDigitalProps) {
    return (
        <div className={styles.row}>
            <KRDInput
                placeholder='Ex: "Contém conservantes"'
                width="100%"
                label="Descrição Nutricional"
                name="descricaoNutricional"
                control={control}
                error={errors.descricaoNutricional?.message?.toString()}
            />
            <KRDInput
                placeholder="Posição no menu"
                width="10%"
                label="Posição"
                name="posicao"
                control={control}
                error={errors.posicao?.message?.toString()}
            />
            <Controller
                name="visivelMenu"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                    <SelectStatus title="Status" width="15%" selected={field.value} setSelected={field.onChange} />
                )}
            />
            <Controller
                name="isAlcoholic"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                    <SelectSimNao title="Alcoólico" width="15%" selected={field.value} setSelected={field.onChange} />
                )}
            />
            <Controller
                name="serving"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                    <SelectNumber
                        title="Serve quantas pessoas?"
                        min={0}
                        max={5}
                        width="15%"
                        selected={field.value}
                        setSelected={field.onChange}
                    />
                )}
            />
            <KRDInput
                placeholder="Calorias"
                width="20%"
                label="Calorias"
                name="calories"
                control={control}
                error={errors.calories?.message?.toString()}
            />
            <SelectTipoCaloria width="20%" selected={tipoCal} setSelected={setTipoCal} />

            <div className={styles.prices}>
                <b>Precos</b>
                <KRDInput
                    placeholder="Keeta"
                    width="150px"
                    label="Keeta"
                    name="valorKeeta"
                    control={control}
                    error={errors.valorKeeta?.message?.toString()}
                />
            </div>

            <SuitableDiet
                value={produto.suitableDiet}
                onChange={(r) => setProduto({ ...produto, suitableDiet: r })}
            />
            <Allergens value={produto.allergen} onChange={(r) => setProduto({ ...produto, allergen: r })} />
        </div>
    );
}