import Loading from "@/components/Loading";
import DataTable, { TableColumn } from "react-data-table-component";

interface props{
  columns: TableColumn<unknown>[]
  data: unknown[]
  loading?: boolean
  selectable?: boolean
  pagination?: boolean
  handleChangeSelected?: (data) => void
}
export default function CustomTable({pagination, handleChangeSelected, selectable, loading, columns, data}: props){
    return (
        <DataTable
        customStyles={{
            cells:{
                style:{
                    fontWeight: 'bold',
                }
            },
            rows:{
                style:{
                    backgroundColor: 'var(--gray-200)',
                }
            },
            
        }}
            columns={columns}
            data={data}
            striped
           pagination={pagination == undefined ? true : pagination}
           selectableRows={selectable}
          
           onSelectedRowsChange={handleChangeSelected}
           paginationComponentOptions={{
            rowsPerPageText: 'Itens por Pagina',
            selectAllRowsItemText: 'Tudo',
            rangeSeparatorText: 'de',
           }}
           progressPending={loading}
           progressComponent={<Loading/>}
        />
    );
}