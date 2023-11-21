import { CSSProperties } from 'react';
import styles from './styles.module.scss';

interface props{
    value: string
    title: string
    height?: string
    style?: CSSProperties
}

export default function BoxInfo({style, value, title, height}: props){
    return(
        <div className={styles.content} style={style}>
            <div className={styles.value} style={{height: height}}>
                {value}
            </div>
            <div className={styles.title}>
                {title}
            </div>

        </div>
    )
}