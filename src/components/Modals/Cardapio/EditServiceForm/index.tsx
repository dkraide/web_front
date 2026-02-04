import { Tab, Tabs } from 'react-bootstrap';
import BaseModal from '../../Base/Index';
import styles from './styles.module.scss';

type props = {
    setClose: (value?: boolean) => void;
}
export default function EditServiceForm({ setClose }: props) {


    return (<BaseModal isOpen={true} setClose={setClose} title="Editar Horario de Funcionamento">
        <div className={styles.container}>
            <Tabs
                defaultActiveKey="delivery"
                id="uncontrolled-tab-example"
                className="mb-3"
            >
                  <span>
                    
                  </span>
                  <Tab eventKey="delivery" title="Delivery / Para Entregar">

                  </Tab>
                  <Tab eventKey="takeout" title="Para Retirar">

                  </Tab>
                  <Tab eventKey="indoor" title="Para Consumir no Local">

                  </Tab>

            </Tabs>


        </div>
    </BaseModal>)

}