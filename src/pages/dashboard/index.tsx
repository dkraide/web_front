import IEmpresa from '@/interfaces/IEmpresa';
import styles from './styles.module.scss';
import IVenda from '@/interfaces/IVenda';
import { useContext, useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import IDespesa from '@/interfaces/IDespesa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import CustomButton from '@/components/ui/Buttons';
import { InputGroup } from '@/components/ui/InputGroup';
import { addDays, format } from 'date-fns';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '@/contexts/AuthContext';
import Loading from '@/components/Loading';
import IVendaProduto from '@/interfaces/IVendaProduto';
import { Badge } from 'react-bootstrap';
import { LabelGroup } from '@/components/ui/LabelGroup';
import { canSSRAuth } from '@/utils/CanSSRAuth';


interface resProps {
  vendaHoje:number
  vendaMes:number
  canceladaHoje :number
  canceladaMes :number
  faturadaHoje :number
  faturadaMes :number
}

export default function Dashboard() {

  const [obj, setObj] = useState<resProps>()
  const [produtos ,setProdutos] = useState<IVendaProduto[]>([])
  const [despesas, setDespesas] = useState<IDespesa[]>([])
  const {getUser} = useContext(AuthContext);

const loadData = async () => {
    const user = getUser();
    await api.get(`/Dashboard/Vendas?Empresa=${(await user).empresaSelecionada}`)
      .then(({ data }: AxiosResponse<resProps>) => {
        console.log(data);
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
  }

  useEffect(() => {
    loadData();
  }, [])

  return (
    <div className={styles.container}>
      <h3>Vendas</h3>
      {obj ? (
          <div className={styles.cardInfos}>
          <CardInfo style={'success'} title={'Vendas'} value1={obj.vendaHoje || 0} value2={obj.vendaMes|| 0} />
          <CardInfo style={'primary'} title={'Faturadas'} value1={obj.faturadaHoje|| 0} value2={obj.faturadaMes|| 0} />
          <CardInfo style={'danger'} title={'Canceladas'} value1={obj.canceladaHoje|| 0} value2={obj.canceladaMes|| 0} />
        </div>
      ) : <Loading/>}
      <h3>Produtos</h3>
      <div className={styles.chart}>
        <ResponsiveContainer height={400}>
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
            <Bar  dataKey="valor" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{width: '50%'}}>
        <h3>Proximas despesas</h3>
        {despesas.length == 0 ? <h5>Parece que nao ha despesas proximas =)</h5> : despesas.map((d) => <Despesa key={d.id} descricao={d.motivoLancamento?.nome || d.descricao} statusLancamento={d.statusLancamento} valorTotal={d.valorTotal} dataVencimento={d.dataVencimento}/>)}

      </div>

    </div>
  )
}
const CardInfo = ({ title, value1, value2, style }) => {
  return (
    <div className={[styles.cardInfo].join(' ')}>
      <div className={styles.content}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label className={styles.title}>R${value1.toFixed(2)}</label>
          <label className={styles.info}>Hoje</label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label className={styles.title}>R${value2.toFixed(2)}</label>
          <label className={styles.info}>Mensal</label>
        </div>
      </div>
      <div className={[styles.footer, styles[style]].join(' ')}>
        <label>{title}</label>
      </div>
    </div>
  )
}

const Despesa = ({descricao, statusLancamento, valorTotal, dataVencimento}) => {

 function getStatus(){
        if(statusLancamento){
          return <Badge color={'primary'}>Pago</Badge>
        }
        if(new Date < new Date(dataVencimento)){
          return <Badge color={'success'}>Em Aberto</Badge>
        }
        return <Badge color={'danger'}>Vencido</Badge>
 }
 return(
  <div>
    <h5>{descricao}</h5>
    <div style={{display: 'flex', flexDirection:'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
      <label>R${valorTotal.toFixed(2)}</label>
      <label>{format(new Date(dataVencimento), 'dd/MM/yyyy')}</label>
      <label>{getStatus()}</label>
    </div>
    <hr/>
  </div>
 )
}
export const getServerSideProps = canSSRAuth(async (ctx) => {
  return {
      props: {

      }
  }
})