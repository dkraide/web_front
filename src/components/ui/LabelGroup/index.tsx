import styles from './styles.module.scss';
import { HTMLAttributes } from 'react';

interface inputProps extends HTMLAttributes<HTMLElement>{
   title: string
   value: any
   width?: string
   minWidth?: string
   fontSize?: string
   color?: string
}

export function LabelGroup({color, title, width, minWidth,value, fontSize, ...rest}: inputProps ){
    return(
        <div {...rest} className={styles.box} style={{width: width || '100%', minWidth: minWidth || 'auto', color: color || 'black'}}>
            <label style={{color: color || 'black'}} className={styles.title}>{title}</label>
            <label  className={styles.input} style={{fontSize: fontSize || '13px', color: color || 'black'}}>{value}</label>
        </div>
    )
}