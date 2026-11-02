

// interface props {
//     isOpen: boolean
//     id: number
//     setClose: (res?: boolean) => void
//     color?: string
//     user: IUsuario
// }
// export default function CadastroGrupoForm({ user, isOpen, id, setClose, color }: props) {

//     const {
//         register,
//         getValues,
//         setValue,
//         handleSubmit,
//         formState: { errors } } =
//         useForm();




//         } else {
//             classe.empresaId = user.empresaSelecionada;
//             api.post(`GrupoAdicional/CreateGrupo`, classe)
//                 .then(({ data }: AxiosResponse) => {
//                     toast.success(`ingrediente cadastrado com sucesso!`);
//                     setClose(true);
//                 })
//                 .catch((err: AxiosError) => {
//                     toast.error(`Erro ao criar ingrediente. ${err.response?.data}`);
//                 })
//         }
//         setSending(false);
//     }

//     const removeItem = async (item: IGrupoAdicionalMateriaPrima) => {
//         //ja ta na nuvem
//         if(item.id > 0){
//             setLoading(true);
//             await api.delete(`/GrupoAdicionalMateriaPrima/Remove?id=${item.id}`)
//             .then(() => {
//                 toast.success('Item Removido com sucesso!');
//                 var res = _.remove(classe.produtosAdicionais, p => p.id == item.id);
//                 setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
//             }).catch((err) => {
//                 toast.error('Erro ao tentar remover item');
//             })
//             setLoading(false);
//         }
//         //nao ta na nuvem
//         else{
//             var res = _.remove(classe.produtosAdicionais, p => p.materiaPrimaId == item.materiaPrimaId);
//             setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
//             toast.success('Item Removido com sucesso!');
//         }
//     }
//     const addItem = (item: IMateriaPrima, valor: number) => {
//         if(!classe.produtosAdicionais){
//             classe.produtosAdicionais = [];
//         };
//         var index  = _.findIndex(classe.produtosAdicionais, p => p.materiaPrimaId == item.id);
//         if(index >= 0){
//             toast.error('item ja adicionado ao grupo.');
//             return;
//         }
//         classe.produtosAdicionais.push({
//             idGrupoAdicional: classe.idGrupoAdicional,
//             idGrupoAdicionalMateriaPrima: 0,
//             id: 0,
//             nome: item.nome,
//             valor: valor,
//             status: true,
//             grupoAdicionalId: classe.id,
//             grupoAdicional: undefined,
//             materiaPrima: item,
//             materiaPrimaId: item.id,
//             idMateriaPrima: item.idMateriaPrima,
//             empresaId: user.empresaSelecionada,
//             lastChange: new Date(),
//             localCriacao: 'NUVEM'
//         });
//         console.log(classe.produtosAdicionais)
//         setClasse({...classe, produtosAdicionais: classe.produtosAdicionais});
//         toast.success('Item adicionado com sucesso!');
//     }

//     const columns = [
//         {
//             name: '#',
//             cell: (row: IGrupoAdicionalMateriaPrima) => <CustomButton onClick={() => { removeItem(row) }} typeButton={'outline-main'}><FontAwesomeIcon icon={faTrash} /></CustomButton>,
//             sortable: true,
//             grow: 0
//         },
//         {
//             name: 'Nome',
//             selector: (row: IGrupoAdicionalMateriaPrima) => row.nome,
//             sortable: true,
//         },
//         {
//             name: 'Valor',
//             selector: (row: IGrupoAdicionalMateriaPrima) => row.valor.toFixed(2),
//             sortable: true,
//             grow: 0
//         },
//     ]
