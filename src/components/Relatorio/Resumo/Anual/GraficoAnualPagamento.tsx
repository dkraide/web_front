import { resumoMensalPagamento } from '@/pages/relatorio/resumo/anual';
import styles from './styles.module.scss';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';

type Props = {
  dados: resumoMensalPagamento[];
};

export default function GraficoAnualPagamento({ dados }: Props) {
  const dadosTransformados = transformarParaBarChart(dados);

  // Descobrir quais descrições existem para criar as barras dinamicamente
  const descricoes = Array.from(
    new Set(dados.map((d) => d.descricao))
  );

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={dadosTransformados}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value)
            }
          />
          <Legend verticalAlign="top" height={36} />
          {descricoes.map((descricao, index) => (
            <Bar
              key={descricao}
              dataKey={descricao}
              name={descricao}
              fill={getColor(index)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// função auxiliar para cores, pode customizar
function getColor(index: number) {
  const cores = ['#8884d8', '#82ca9d', '#ff7300', '#413ea0', '#ff0000'];
  return cores[index % cores.length];
}

// transformação de dados dentro do componente ou exportada
function transformarParaBarChart(dados: resumoMensalPagamento[]) {
  const mapMes = new Map<string, any>();

  dados.forEach(({ mes, descricao, valor }) => {
    if (!mapMes.has(mes)) {
      mapMes.set(mes, { mes });
    }
    const obj = mapMes.get(mes);
    obj[descricao] = valor;
  });

  return Array.from(mapMes.values()).sort((a, b) => a.mes.localeCompare(b.mes));
}
