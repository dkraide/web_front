import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from './styles.module.scss';

type ResumoMensal = {
    mes: string; // Ex: "2025-01"
    quantidade: number;
    total: number;
    canceladas: number;
    faturados: number;
};

interface Props {
    dados: ResumoMensal[];
}

export default function GraficoAnualVendas({ dados }: Props) {
    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip
                        formatter={(value: number) =>
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                        }
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="total" name="Vendas" stroke="#8884d8" />
                    <Line type="monotone" dataKey="custo" name="Custo" stroke="#e24343" />
                    <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#3ac569" />
                    <Line type="monotone" dataKey="faturados" name="Faturadas" stroke="#82ca9d" />
                     <Line type="monotone" dataKey="canceladas" name="Canceladas" stroke="#ff7300" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
