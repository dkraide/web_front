import Loading from '@/components/Loading';
import { ButtonHTMLAttributes } from 'react';
import Button from 'react-bootstrap/Button';
import styles from './styles.module.scss'

interface props extends  ButtonHTMLAttributes<HTMLButtonElement>{
    typeButton: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dark' | 'main' | 'outline-main',
    loading?: boolean
    size?: "sm" | "lg"
}

export default function CustomButton  ({size, loading, typeButton,children, onClick, ...rest}: props){

    if(typeButton == 'outline-main'){
        return <Button size={size}  onClick={onClick} disabled={loading} {...rest} className={styles[typeButton]}>
    {loading ? <Loading/> : children}
   </Button>
    }
   return <Button size={size} variant={typeButton} onClick={onClick} disabled={loading} {...rest} className={styles[typeButton]}>
    {loading ? <Loading/> : children}
   </Button>
}