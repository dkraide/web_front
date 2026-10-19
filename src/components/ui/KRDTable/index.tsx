import { ReactNode, useState, useMemo } from "react"
import Loading from "@/components/Loading"
import styles from "./styles.module.scss"

interface KRDTableProps<T = unknown> {
  columns: KRDColumn<T>[]
  data: T[]
  loading?: boolean
  selectable?: boolean
  pagination?: boolean
  paginationPerPage?: number
  handleChangeSelected?: (data: T[]) => void
  expandableComponent?: (row: T) => ReactNode
  emptyMessage?: string
  /** Paginação/ordenação no servidor: `data` já é apenas a página atual. */
  serverSide?: KRDServerSide
}

export interface KRDServerSide {
  total: number
  page: number
  perPage: number
  sort?: { key: string; desc: boolean } | null
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onSortChange: (sort: { key: string; desc: boolean } | null) => void
}

export interface KRDColumn<T = unknown> {
  name: string
  selector?: (row: T) => string | number
  cell?: (row: T) => ReactNode
  sortable?: boolean
  /** Chave de ordenação enviada ao servidor (modo serverSide). */
  sortKey?: string
  width?: string
  right?: boolean
}

const PAGE_OPTIONS = [5, 10, 15, 20, 25, 35, 50, 100]

export default function KRDTable<T = unknown>({
  columns,
  data,
  loading,
  selectable,
  pagination = true,
  paginationPerPage = 10,
  handleChangeSelected,
  expandableComponent,
  emptyMessage = "Sem itens para serem exibidos.",
  serverSide,
}: KRDTableProps<T>) {
  const [localPage, setLocalPage]           = useState(1)
  const [localPerPage, setLocalPerPage]     = useState(paginationPerPage)
  const currentPage = serverSide ? serverSide.page : localPage
  const perPage     = serverSide ? serverSide.perPage : localPerPage
  const setCurrentPage = (v: number | ((p: number) => number)) => {
    const next = typeof v === "function" ? v(currentPage) : v
    if (serverSide) serverSide.onPageChange(next)
    else setLocalPage(next)
  }
  const [selectedRows, setSelectedRows]     = useState<Set<number>>(new Set())
  const [expandedRows, setExpandedRows]     = useState<Set<number>>(new Set())
  const [sortConfig, setSortConfig]         = useState<{ col: number; dir: "asc" | "desc" } | null>(null)
  const [selectAll, setSelectAll]           = useState(false)

  const sorted = useMemo(() => {
    if (serverSide || !sortConfig) return data
    const col = columns[sortConfig.col]
    if (!col?.selector) return data
    return [...data].sort((a, b) => {
      const va = col.selector!(a)
      const vb = col.selector!(b)
      if (va < vb) return sortConfig.dir === "asc" ? -1 : 1
      if (va > vb) return sortConfig.dir === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortConfig, columns, serverSide])

  const totalRows  = serverSide ? serverSide.total : sorted.length
  const totalPages = Math.ceil(totalRows / perPage)
  const pageData   = pagination && !serverSide
    ? sorted.slice((currentPage - 1) * perPage, currentPage * perPage)
    : sorted

  function toggleSort(idx: number) {
    if (!columns[idx]?.sortable) return
    if (serverSide) {
      const key = columns[idx].sortKey
      if (!key) return
      const cur = serverSide.sort
      serverSide.onSortChange(
        cur?.key !== key ? { key, desc: false } : cur.desc ? null : { key, desc: true }
      )
      serverSide.onPageChange(1)
      return
    }
    setSortConfig(prev =>
      prev?.col === idx
        ? { col: idx, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col: idx, dir: "asc" }
    )
    setCurrentPage(1)
  }

  function toggleRow(idx: number) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      const selected = sorted.filter((_, i) => next.has(i))
      handleChangeSelected?.(selected)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedRows(new Set())
      handleChangeSelected?.([])
    } else {
      const all = new Set(sorted.map((_, i) => i))
      setSelectedRows(all)
      handleChangeSelected?.(sorted)
    }
    setSelectAll(!selectAll)
  }

  function toggleExpand(idx: number) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function handlePerPage(val: number) {
    if (serverSide) {
      serverSide.onPerPageChange(val)
      serverSide.onPageChange(1)
      return
    }
    setLocalPerPage(val)
    setLocalPage(1)
  }

  const globalIdx = (localIdx: number) => (currentPage - 1) * perPage + localIdx

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loading />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className={styles.checkbox}
                  />
                </th>
              )}
              {expandableComponent && <th className={styles.expandCell} />}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`${styles.th} ${col.sortable ? styles.sortable : ""} ${col.right ? styles.right : ""}`}
                  style={col.width ? { width: col.width } : {}}
                  onClick={() => toggleSort(i)}
                >
                  {col.name}
                  {col.sortable && (
                    <span className={styles.sortIcon}>
                      {serverSide
                        ? serverSide.sort?.key === col.sortKey
                          ? serverSide.sort?.desc ? "↓" : "↑"
                          : "↕"
                        : sortConfig?.col === i
                          ? sortConfig.dir === "asc" ? "↑" : "↓"
                          : "↕"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (expandableComponent ? 1 : 0)}
                  className={styles.empty}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, localIdx) => {
                const gIdx     = globalIdx(localIdx)
                const isSelected = selectedRows.has(gIdx)
                const isExpanded = expandedRows.has(gIdx)

                return (
                  <>
                    <tr
                      key={gIdx}
                      className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                    >
                      {selectable && (
                        <td className={styles.checkCell}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(gIdx)}
                            className={styles.checkbox}
                          />
                        </td>
                      )}
                      {expandableComponent && (
                        <td className={styles.expandCell}>
                          <button
                            className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnOpen : ""}`}
                            onClick={() => toggleExpand(gIdx)}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      )}
                      {columns.map((col, ci) => (
                        <td
                          key={ci}
                          className={`${styles.td} ${col.right ? styles.right : ""}`}
                        >
                          {col.cell ? col.cell(row) : col.selector?.(row) ?? "—"}
                        </td>
                      ))}
                    </tr>

                    {expandableComponent && isExpanded && (
                      <tr key={`exp-${gIdx}`} className={styles.expandedRow}>
                        <td
                          colSpan={columns.length + (selectable ? 1 : 0) + 1}
                          className={styles.expandedCell}
                        >
                          {expandableComponent(row)}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerLabel}>Itens por página</span>
            <select
              className={styles.perPageSelect}
              value={perPage}
              onChange={e => handlePerPage(Number(e.target.value))}
            >
              {PAGE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span className={styles.footerLabel}>
              {totalRows === 0 ? "0" : `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, totalRows)}`} de {totalRows}
            </span>
          </div>

          <div className={styles.footerRight}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ""}`}
                    onClick={() => setCurrentPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              ›
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}