import { useState, useEffect } from 'react';
import styles from '../styles.module.scss';

type Tag = {
    label: string;
    value: string;
};

interface AllergensProps {
    value: string;
    onChange: (newValue: string) => void;
}

export default function Allergens({ value, onChange }: AllergensProps) {
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
            ? selecteds.filter((x) => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => (
        <span
            onClick={() => onToggle(value)}
            className={isSelected(value) ? styles.itemSelected : styles.itemNonSelected}
        >
            {label}
        </span>
    );

    return (
        <div className={styles.allergens}>
            <b>Alérgenos</b>
            <div className={styles.items}>
                {tags.map((tag) => (
                    <Item key={tag.value} label={tag.label} value={tag.value} />
                ))}
            </div>
        </div>
    );
}