import Loading from "@/components/Loading";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

interface props{
  columns: TableColumn<unknown>[]
  data: unknown[]
  loading?: boolean
  selectable?: boolean
  pagination?: boolean
  handleChangeSelected?: (data) => void
  expandableIcon?: ReactNode
  expandableComponent?: (row) => ReactNode
}
export default function CustomTable({expandableComponent, expandableIcon, pagination, handleChangeSelected, selectable, loading, columns, data}: props){
    return (
        <DataTable
        customStyles={{
            cells:{
                style:{
                    fontWeight: 'bold',
                    fontSize: '12px'
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
           noDataComponent={'Sem itens para serem exibidos.'}
           selectableRows={selectable}
           expandableRows={!!expandableIcon}
           expandableIcon={{collapsed: expandableIcon, expanded: expandableIcon}}
           onSelectedRowsChange={handleChangeSelected}
           expandableRowsComponent={expandableComponent}
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