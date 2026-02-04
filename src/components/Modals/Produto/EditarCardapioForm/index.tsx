import IProduto from '@/interfaces/IProduto';
import BaseModal from '../../Base/Index';
import styles from './styles.module.scss';
import { useForm } from 'react-hook-form';
import { InputForm } from '@/components/ui/InputGroup';
import { isMobile } from 'react-device-detect';
import { useEffect, useState } from 'react';
import SelectSimNao from '@/components/Selects/SelectSimNao';
import SelectNumber from '@/components/Selects/SelectNumber';
import SelectTipoCaloria from '@/components/Selects/SelectTipoCaloria';
import CustomButton from '@/components/ui/Buttons';
import Loading from '@/components/Loading';
import { api } from '@/services/apiClient';
import { toast } from 'react-toastify';
import { fGetNumber } from '@/utils/functions';

type props = {
    item: IProduto
    setClose: (res?: boolean) => void
}
export function EditarCardapioForm({ item, setClose }: props) {
    const [produto, setProduto] = useState(item);
    const [loading, setLoading] = useState(false);
    const [tipoCal, setTipoCal] = useState('Cal')
    const [caloriesValue, setCaloriesValue] = useState('');

    useEffect(() => {
        if (!produto?.calories) return;

        const splitted = produto.calories.split(' ');

        setCaloriesValue(splitted[0] ?? '');
        if (splitted[1]) {
            setTipoCal(splitted[1]);
        }
    }, [produto.calories]);
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();

    const getCalories = () => {
        if (!produto.calories) {
            return ''
        };
        var splitted = produto.calories.split(' ');
        if (splitted.length > 0) {
            if (splitted.length > 1) {
                setTipoCal(splitted[1])
            }
            return splitted[0];
        }
        return produto.calories;
    }

    const onSubmit = async (data) => {
        if (!loading) {
            setLoading(true);
        }
        const updatedProduto = {
            ...produto,
            nome: data.nome,
            descricao: data.descricao,
            descricaoNutricional: data.descricaoNutricional,
            calories: `${data.calories} ${tipoCal}`,
            valor: fGetNumber(data.valor),
            valorKeeta: fGetNumber(data.valorKeeta),
        };
        console.log(updatedProduto)
        await api.put(`/produto/UpdateProduct`, updatedProduto).then((data) => {
            toast.success(`Item atualizado!`);
            setClose(true);

        }).catch((err) => {
            console.log(err);
        });
        setLoading(false);

    }
    return (
        <BaseModal title={'Editar campos do cardapio'} isOpen={true} setClose={setClose}>
            {loading ? (
                <BaseModal title={'Editar campos do cardapio'} isOpen={true} setClose={setClose}>
                    <Loading />
                </BaseModal>
            ) : (
                <div className={styles.container}>
                    <InputForm placeholder={'Nome do Produto'} defaultValue={produto.nome} width={'100%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <InputForm placeholder={'Descrição '} defaultValue={produto.descricao} width={'100%'} title={'Descrição'} errors={errors} inputName={"descricao"} register={register} />
                    <InputForm placeholder={'Ex: "Contém conservantes"'} defaultValue={produto.descricaoNutricional} width={'70%'} title={'Descrição Nutricional'} errors={errors} inputName={"descricaoNutricional"} register={register} />
                    <SelectSimNao width={'30%'} selected={produto.isAlcoholic} title={'Alcoólico?'} setSelected={(r) => setProduto({ ...produto, isAlcoholic: r })} />
                    <SelectNumber width={'30%'} selected={produto.serving} title={'Serve quantas pessoas?'} setSelected={(r) => setProduto({ ...produto, serving: r })} min={0} max={5} />
                    <InputForm placeholder={'Calorias'} defaultValue={caloriesValue} width={'20%'} title={'Calorias'} errors={errors} inputName={"calories"} register={register} />
                    <SelectTipoCaloria width={'20%'} selected={tipoCal} setSelected={setTipoCal} />
                    <div className={styles.prices}>
                        <b>Precos</b>
                        <InputForm placeholder={'Menu Digital'} defaultValue={produto.valor} width={'150px'} title={'Menu Digital'} errors={errors} inputName={"valor"} register={register} />
                        <InputForm placeholder={'Keeta'} defaultValue={produto.valorKeeta} width={'150px'} title={'Keeta'} errors={errors} inputName={"valorKeeta"} register={register} />

                    </div>
                    <SuitableDietComponent value={produto.suitableDiet} onChange={(r) => setProduto({ ...produto, suitableDiet: r })} />
                    <AllergenComponent value={produto.allergen} onChange={(r) => setProduto({ ...produto, allergen: r })} />
                    <div className={styles.buttons}>
                        <CustomButton onClick={() => { setClose() }}>Cancelar</CustomButton>
                        <CustomButton onClick={() => { handleSubmit(onSubmit)() }}>Cadastrar</CustomButton>

                    </div>
                </div>
            )
            }
        </BaseModal >
    )
}


type Tag = {
    label: string;
    value: string;
};
type SuitableComponentProps = {
    value: string;
    onChange: (newValue: string) => void;
};
const SuitableDietComponent = ({ value, onChange }: SuitableComponentProps) => {
    const tags: Tag[] = [
        { label: 'DIABÉTICOS', value: 'DIABETIC' },
        { label: 'SEM GLÚTEN', value: 'GLUTEN_FREE' },
        { label: 'HALAL', value: 'HALAL' },
        { label: 'HINDU', value: 'HINDU' },
        { label: 'KOSHER', value: 'KOSHER' },
        { label: 'BAIXA CALORIA', value: 'LOW_CALORIE' },
        { label: 'BAIXA GORDURA', value: 'LOW_FAT' },
        { label: 'SEM LACTOSE', value: 'LOW_LACTOSE' },
        { label: 'BAIXO SÓDIO', value: 'LOW_SALT' },
        { label: 'VEGANO', value: 'VEGAN' },
        { label: 'VEGETARIANO', value: 'VEGETARIAN' },
    ];

    const [selecteds, setSelecteds] = useState<string[]>([]);

    useEffect(() => {
        if (!value) return;

        const splitted = value.split(',');
        setSelecteds(splitted);
    }, [value]);

    const isSelected = (s: string) => {
        return selecteds.includes(s);
    };

    const onToggle = (s: string) => {
        const newList = isSelected(s)
            ? selecteds.filter(x => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => {
        return (
            <span
                onClick={() => onToggle(value)}
                className={
                    isSelected(value)
                        ? styles.itemSelected
                        : styles.itemNonSelected
                }
            >
                {label}
            </span>
        );
    };

    return (
        <div className={styles.suitableDiet}>
            <b>Dieta Adequada</b>
            <div className={styles.items}>
                {tags.map(tag => (
                    <Item
                        key={tag.value}
                        label={tag.label}
                        value={tag.value}
                    />
                ))}
            </div>
        </div>
    );
};
const AllergenComponent = ({ value, onChange }: SuitableComponentProps) => {
    const tags: Tag[] = [
        { label: 'Amêndoas', value: 'ALMONDS' },
        { label: 'Álcool', value: 'ALCOHOL' },
        { label: 'Cevada', value: 'BARLEY' },
        { label: 'Castanha-do-Pará', value: 'BRAZIL_NUTS' },
        { label: 'Castanha de Caju', value: 'CASHEW_NUTS' },
        { label: 'Aipo (Salsão)', value: 'CELERY' },
        { label: 'Cereais com Glúten', value: 'CEREALS_CONTAINING_GLUTEN' },
        { label: 'Cacau', value: 'COCOA' },
        { label: 'Coentro', value: 'CORIANDER' },
        { label: 'Milho', value: 'CORN' },
        { label: 'Crustáceos', value: 'CRUSTACEANS' },
        { label: 'Ovos', value: 'EGGS' },
        { label: 'Peixes', value: 'FISH' },
        { label: 'Glúten', value: 'GLUTEN' },
        { label: 'Avelãs', value: 'HAZELNUTS' },
        { label: 'Kamut', value: 'KAMUT' },
        { label: 'Lactose', value: 'LACTOSE' },
        { label: 'Leite', value: 'MILK' },
        { label: 'Moluscos', value: 'MOLLUSCS' },
        { label: 'Mostarda', value: 'MUSTARD' },
        { label: 'Aveia', value: 'OAT' },
        { label: 'Amendoim', value: 'PEANUTS' },
        { label: 'Ervilhas', value: 'PEAS' },
        { label: 'Nozes Pecã', value: 'PECAN_NUTS' },
        { label: 'Pistache', value: 'PISTACHIOS' },
        { label: 'Centeio', value: 'RYE' },
        { label: 'Gergelim', value: 'SESAME_SEEDS' },
        { label: 'Soja', value: 'SOYBEANS' },
        { label: 'Espelta', value: 'SPELT' },
        { label: 'Dióxido de Enxofre', value: 'SULPHUR_DIOXIDE' },
        { label: 'Frutos Secos', value: 'TREE_NUTS' },
        { label: 'Traços de Frutos Secos', value: 'TREE_NUT_TRACES' },
        { label: 'Nozes', value: 'WALNUTS' },
        { label: 'Trigo', value: 'WHEAT' },
        { label: 'Sem Alérgenos Declarados', value: 'NO_DECLARED_ALLERGENS' },
    ];
    const [selecteds, setSelecteds] = useState<string[]>([]);

    useEffect(() => {
        if (!value) return;
        setSelecteds(value.split(','));
    }, [value]);

    const isSelected = (s: string) => selecteds.includes(s);

    const onToggle = (s: string) => {
        const newList = isSelected(s)
            ? selecteds.filter(x => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => (
        <span
            onClick={() => onToggle(value)}
            className={
                isSelected(value)
                    ? styles.itemSelected
                    : styles.itemNonSelected
            }
        >
            {label}
        </span>
    );

    return (
        <div className={styles.allergens}>
            <b>Alérgenos</b>
            <div className={styles.items}>
                {tags.map(tag => (
                    <Item
                        key={tag.value}
                        label={tag.label}
                        value={tag.value}
                    />
                ))}
            </div>
        </div>
    );
};
