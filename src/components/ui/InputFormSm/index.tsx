import styles from './styles.module.scss';
import { InputHTMLAttributes,  forwardRef } from 'react';
import React from "react";



interface inputForm extends InputHTMLAttributes<HTMLInputElement>{
    title?: string
    width?: string
    minWidth?: string
    invalid?: boolean
    errors?: any
    register?: any,
    inputName: string,
    rules?: any

}

const InputFormSm = ({rules, title,  width,minWidth, inputName, register, errors,onChange,  ...rest } : inputForm) => {
    return (
        <div className={styles["group"]} style={{width: width || '100%', minWidth: minWidth || 'auto'}}>
        <span className={errors[inputName] ? styles["error"] : styles['']}>{errors[inputName] && 'campo invalido'}</span>
        <input {...register(inputName, {...rules, onChange: onChange})} {...rest} placeholder={title} />
        <span className={styles["bar"]}></span>
        </div>
    );
};

export {InputFormSm};


