import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import IDespesa from '@/interfaces/IDespesa';
import { format, isToday } from 'date-fns';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, LineChart, Line } from 'recharts';
import { AuthContext } from '@/contexts/AuthContext';
import Loading from '@/components/Loading';
import IVendaProduto from '@/interfaces/IVendaProduto';
import { Badge } from 'react-bootstrap';
import { canSSRAuth } from '@/utils/CanSSRAuth';
import IVenda from '@/interfaces/IVenda';
import _ from 'lodash';
import IVendaPagamento from '@/interfaces/IVendaPagamento';
import { random_rgba } from '@/utils/functions';
import IDuplicata from '@/interfaces/IDuplicata';
import PagamentoDuplicata from '@/components/Modals/PagamentoDuplicata';


interface resProps {
  vendaHoje: number
  vendaMes: number
  canceladaHoje: number
  canceladaMes: number
  faturadaHoje: number
  faturadaMes: number
}

export default function Dashboard() {

  const [obj, setObj] = useState<IVenda[]>([])
  const [produtos, setProdutos] = useState<IVendaProduto[]>([])
  const [despesas, setDespesas] = useState<IDespesa[]>([])
  const [duplicatas, setDuplicatas] = useState<IDuplicata[]>([])
  const { getUser } = useContext(AuthContext);

  const loadData = async () => {
    const user = getUser();
    await api.get(`/Dashboard/VendasDetail?Empresa=${(await user).empresaSelecionada}`)
      .then(({ data }: AxiosResponse<IVenda[]>) => {
        setObj(data);
      }).catch((err: AxiosError) => {
        toast.error(`Erro ao buscar vendas. `);
      })

    await api.get(`/Dashboard/Produtos?Empresa=${(await user).empresaSelecionada}`)
      .then(({ data }: AxiosResponse<IVendaProduto[]>) => {
        setProdutos(data);
      }).catch((err: AxiosError) => {
        toast.error(`Erro ao buscar produtos. `);
      })
    await api.get(`/Dashboard/Despesa?Empresa=${(await user).empresaSelecionada}`)
      .then(({ data }: AxiosResponse<IDespesa[]>) => {
        setDespesas(data);
      }).catch((err: AxiosError) => {
        toast.error(`Erro ao buscar despesas. `);
      })
    await api.get(`/Financeiro/GetDuplicatasAberto?EmpresaId=${(await user).empresaSelecionada}`)
    .then(({data}: AxiosResponse) => {
         setDuplicatas(data);

    }).catch((err: AxiosError) => {

    });
  }

  useEffect(() => {

    loadData();
  }, []);

  function getData() {
    var orcamento = _.sumBy(obj, p => {
      if (p.statusVenda && !p.estd) {
        return p.valorTotal;
      } else return 0;
    })
    var faturado = _.sumBy(obj, p => {
      if (p.statusVenda && p.estd) {
        return p.valorTotal;
      } else return 0;
    });
    var list = [];

    list.push({
      label: 'Orcamento',
      value: Number(orcamento.toFixed(2)),
      fill: "var(--blue)",
    },
      {
        label: 'Faturado',
        value: Number(faturado.toFixed(2)),
        fill: "var(--main)"
      });
    return list;

  }
  function getDataDia() {
    var res = _.groupBy(obj, v => {
      var formatted = format(new Date(v.dataVenda), 'dd/MM/yyyy');
      return formatted;
    });
    var list = _.map(res, (collection, key) => {
      return {
        key,
        venda: Number(_.sumBy(collection, (p: IVenda) => p.statusVenda ? p.valorTotal : 0).toFixed(2)),
        custo:Number(_.sumBy(collection, (p: IVenda) => p.statusVenda ? p.valorCusto : 0).toFixed(2)),
      }
    });
    return _.orderBy(list, p => p.key);
  }

  function getDataForma() {
    var pagamentos = [];
    obj?.map((p) => {
      if (p.statusVenda) {
        pagamentos.push(...p.pagamentos);
      }
    });
    var grouped = _.groupBy(pagamentos, (p: IVendaPagamento) => p.descricao);
    var list = _.map(grouped, (collection, key) => {
      return {
        label: key,
        value: Number(_.sumBy(collection, (p: IVendaPagamento) => p.valor).toFixed(2)),
        fill: random_rgba()
      }
    });
    return list;
  }



  return (
    <div className={styles.container}>
      <h4 className={styles["card-title"]}>Vendas</h4>
      {obj ? (
        <div className={styles.cardInfos}>
          <CardInfo vendas={obj} style={'success'} title={'Vendas'} />
          <CardInfo vendas={obj} style={'primary'} title={'Faturadas'} />
          <CardInfo vendas={obj} style={'danger'} title={'Canceladas'} />
        </div>
      ) : <Loading />}
      <div className={styles.card} style={{ width: '100%' }}>
        <h4 className={styles["card-title"]}>Relatorio de Venda por Dia</h4>
        <div className={styles.chart}>
          <ResponsiveContainer height={250} width={'100%'}>
            <LineChart height={150} data={getDataDia()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="venda" name={"Venda (R$)"} stroke="var(--green)" strokeWidth={3} />
              <Line type="monotone" dataKey="custo" name={"Custo (R$)"} stroke="var(--main)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ width: '69%', minWidth: '350px' }}>
        <div className={styles.card} style={{ minHeight: '350px' }}>
          <h4 className={styles["card-title"]}>Proximas despesas</h4>
          <table className={"table"}>
            <thead>
              <tr>
                <th>Despesa</th>
                <th>Valor</th>
                <th>Venc</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {despesas.length == 0 ? <tr><td>Nenhuma despesa encontrada.</td></tr> : despesas.map((d) => <Despesa key={d.id} descricao={d.motivoLancamento?.nome || d.descricao} statusLancamento={d.statusLancamento} valorTotal={d.valorTotal} dataVencimento={d.dataVencimento} />)}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ width: '30%', minWidth: '350px' }}>
        <div className={styles.card} style={{ minHeight: '350px' }}>
          <h4 className={styles["card-title"]}>Faturamento / Orcamento</h4>
          <ResponsiveContainer height={200}>
            <PieChart width={730} height={250}>
              <Pie isAnimationActive label data={getData()} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={50} fill="#8884d8" />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ width: '30%', minWidth: '350px' }}>
        <div className={styles.card} style={{ minHeight: '400px' }}>
          <h4 className={styles["card-title"]}>Pagamentos</h4>
          <ResponsiveContainer height={400}>
            <PieChart  height={300}>
              <Pie isAnimationActive label data={getDataForma()} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={50}  />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={styles.card} style={{ width: '69%' }}>
        <h4 className={styles["card-title"]}>Produtos</h4>
        <div className={styles.chart}>
          <ResponsiveContainer height={400} width={'100%'}>
            <BarChart
              height={300}
              width={1000}
              data={produtos}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="produto" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="valor" fill="var(--main)" activeBar={<Rectangle fill="white" stroke="white" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {duplicatas.length > 0 && <PagamentoDuplicata duplicatas={duplicatas} isOpen={duplicatas.length > 0} setClose={() => {
         setDuplicatas([])
      }}/>}

    </div>
  )
}
const CardInfo = ({ title, style, vendas }) => {

  function getValor(onlyToday) {
    var total = 0;
    switch (style) {
      case 'success':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (p.statusVenda) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return p.valorTotal;
              } else {
                return 0;
              }
            }
            else return p.valorTotal;

          }
          return 0;
        });
        break;
      case 'primary':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (p.statusVenda && p.estd) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return p.valorTotal;
              } else {
                return 0;
              }
            }
            else return p.valorTotal;

          }
          return 0;
        });
        break;
      case 'danger':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (!p.statusVenda) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return p.valorTotal;
              } else {
                return 0;
              }
            }
            else return p.valorTotal;

          }
          return 0;
        });
        break;
    }
    return total;
  }
  function getCount(onlyToday) {
    var total = 0;
    switch (style) {
      case 'success':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (p.statusVenda) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return 1;
              } else {
                return 0;
              }
            }
            else return 1;

          }
          return 0;
        });
        break;
      case 'primary':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (p.statusVenda && p.estd) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return 1;
              } else {
                return 0;
              }
            }
            else return 1;

          }
          return 0;
        });
        break;
      case 'danger':
        total = _.sumBy(vendas, (p: IVenda) => {
          if (!p.statusVenda) {
            if (onlyToday) {
              if (isToday(new Date(p.dataVenda))) {
                return 1;
              } else {
                return 0;
              }
            }
            else return 1;

          }
          return 0;
        });
        break;
    }
    return total;
  }
  return (
    <div className={[styles.cardInfo, styles[style]].join(' ')}>
      <div className={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 className={styles.title}>R${getValor(true).toFixed(2)}</h4>
          <h2 className={styles.info}>{getCount(true)} Hoje</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 className={styles.title}>R${getValor(false).toFixed(2)}</h4>
          <h2 className={styles.info}>{getCount(false)} Mensal</h2>
        </div>
      </div>
      <span className={styles.info}>{title}</span>
    </div>
  )
}

const Despesa = ({ descricao, statusLancamento, valorTotal, dataVencimento }) => {

  function getStatus() {
    if (statusLancamento) {
      return <Badge color={'primary'}>Pago</Badge>
    }
    if (new Date < new Date(dataVencimento)) {
      return <Badge color={'success'}>Em Aberto</Badge>
    }
    return <Badge color={'danger'}>Vencido</Badge>
  }
  return (
    <tr>
      <td>{descricao}</td>
      <td>R$ {valorTotal.toFixed(2)}</td>
      <td>{format(new Date(dataVencimento), 'dd/MM/yyyy')}</td>
      <td>{getStatus()}</td>
    </tr>
  )
}
export const getServerSideProps = canSSRAuth(async (ctx) => {
  return {
    props: {

    }
  }
})