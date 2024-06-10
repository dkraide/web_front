import styles from './styles.module.scss';
import { AuthContext } from '../../contexts/AuthContext';
import { FormEvent, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { canSSRGuest } from '../../utils/CanSSRGuest';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { fGetNumber, fGetOnlyNumber } from '@/utils/functions';
import CustomButton from '@/components/ui/Buttons';


export default function Home() {

  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPDV, setIsPDV] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (email === '' || password === '') {
      toast.error('Campos invalidos');
      return;
    }
    setLoading(true);
    let data = {
      userName: email,
      password: password,
      empresa: fGetNumber(empresa)
    }
    await signIn(data);
    setLoading(false);
  }
  return (
    <>

      <div className={styles.containerCenter}>
        <div className={styles.login}>
          <form onSubmit={handleLogin}>
        <img style={{marginBottom: '0px'}} src={'/krd_logo.png'} width={'500px'} height={'200px'}/>
            <FloatingLabel
              controlId="floatingInput"
              label="Usuario"
              className="mb-3"
            >
              <Form.Control placeholder="Digite seu usuario"
                value={email}
                onChange={(e) => { setEmail(e.target.value) }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="floatingInput"
              label="Senha"
              className="mb-3"
            >
              <Form.Control type="password" placeholder="Digite sua senha"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
              />
            </FloatingLabel>
            <Form.Check // prettier-ignore
              checked={isPDV}
              type="switch"
              id="custom-switch"
              label="Usuario PDV"
              onChange={(v) => setIsPDV(!isPDV)}
            />
            {isPDV && (
              <FloatingLabel
                controlId="floatingInput"
                label="Empresa"
                className="mb-3"
              >
                <Form.Control  placeholder="Digite o CNPJ da Empresa"
                  value={empresa}
                  onChange={(e) => { setEmpresa(e.target.value) }}
                />
              </FloatingLabel>
            )}
            <CustomButton typeButton="outline-main" type={'submit'} style={{padding: '10px', height: 'auto'}}>{loading ? <Spinner animation="border" /> : <>Entrar</>}</CustomButton>
          </form>
        </div>
      </div>
    </>
  )
}
export const getServerSideProps = canSSRGuest(async (ctx) => {
  return {
    props: {}
  }
})