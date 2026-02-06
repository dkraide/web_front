import { useState, useEffect } from 'react';
import styles from '../styles.module.scss';

type Tag = {
    label: string;
    value: string;
};

interface SuitableDietProps {
    value: string;
    onChange: (newValue: string) => void;
}

export default function SuitableDiet({ value, onChange }: SuitableDietProps) {
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
            ? selecteds.filter((x) => x !== s)
            : [...selecteds, s];

        setSelecteds(newList);
        onChange(newList.join(','));
    };

    const Item = ({ label, value }: Tag) => {
        return (
            <span
                onClick={() => onToggle(value)}
                className={isSelected(value) ? styles.itemSelected : styles.itemNonSelected}
            >
                {label}
            </span>
        );
    };

    return (
        <div className={styles.suitableDiet}>
            <b>Dieta Adequada</b>
            <div className={styles.items}>
                {tags.map((tag) => (
                    <Item key={tag.value} label={tag.label} value={tag.value} />
                ))}
            </div>
        </div>
    );
}