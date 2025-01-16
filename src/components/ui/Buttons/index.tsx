import Loading from '@/components/Loading';
import { ButtonHTMLAttributes } from 'react';
import Button from 'react-bootstrap/Button';
import styles from './styles.module.scss'
import { isMobile } from 'react-device-detect';

interface props extends  ButtonHTMLAttributes<HTMLButtonElement>{
    typeButton?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dark' | 'main' | 'outline-main',
    loading?: boolean
    size?: "sm" | "lg"
}

export default function CustomButton ({size, loading, typeButton,children, onClick,className, style, ...rest}: props){

    if(!typeButton){
        typeButton = 'main';
    }

    if(typeButton == 'outline-main'){
        return <Button size={size}  onClick={onClick} disabled={loading} {...rest} style={Object.assign(style || {}, { minWidth:isMobile ? '30%' : 'none'})} className={styles[typeButton]}>
    {loading ? <Loading/> : children}
   </Button>
    }
   return <Button size={size} variant={typeButton} onClick={onClick}  style={Object.assign(style || {}, { minWidth:isMobile ? '30%' : 'none'})} disabled={loading} {...rest} className={[styles[typeButton],className ].join(' ')}>
    {loading ? <Loading/> : children}
   </Button>
}