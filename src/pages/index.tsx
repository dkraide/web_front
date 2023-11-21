import styles from '../styles/home.module.scss';
import { AuthContext } from '../contexts/AuthContext';
import { FormEvent, useContext, useState } from 'react';
import {toast} from 'react-toastify';
import Link from 'next/link';
import { canSSRGuest } from '../utils/CanSSRGuest';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';


export default function Home() {

  const {signIn} = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent){
      event.preventDefault();

     if(email === '' || password === ''){
      toast.error('Campos invalidos');
       return;
     }
     setLoading(true);
      let data = {
        userName: email,
        password: password
      }
      await signIn(data);
      setLoading(false);
  }
  return (
   <>
   
   <div className={styles.containerCenter}>
    <div className={styles.login}>
      <form onSubmit={handleLogin}>
      <FloatingLabel
        controlId="floatingInput"
        label="Usuario"
        className="mb-3"
      >
        <Form.Control  placeholder="Digite seu usuario"
         value={email}
         onChange={(e) => {setEmail(e.target.value)}}
         />
      </FloatingLabel>
      <FloatingLabel
        controlId="floatingInput"
        label="Senha"
        className="mb-3"
      >
        <Form.Control type="password" placeholder="Digite sua senha"
         value={password}
         onChange={(e) => {setPassword(e.target.value)}}
         />
      </FloatingLabel>
      <Button variant="primary" type={'submit'}>{loading ? <Spinner animation="border" /> : <>Entrar</>}</Button>
      </form>
      <Link legacyBehavior href="/signup">
        <a className={styles.text}>Nao possui uma conta? Cadastre-se</a>
      </Link>
    </div>
    </div>
   </>
  )
}
export const getServerSideProps = canSSRGuest(async (ctx) =>{
  return{
    props: {}
  }
} )