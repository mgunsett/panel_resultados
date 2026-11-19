import { useMemo, useState } from 'react'
import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Tooltip, HStack } from '@chakra-ui/react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { cellValue, formatCell, compareBy } from '../../lib/statsSchema'

// ─── TABLA DE ESTADÍSTICAS ───────────────────────────────────────
// Ordenable por cualquier columna (click en el encabezado), con
// scroll horizontal y la primera columna fija para no perder de vista
// de quién es cada fila. `highlight` marca el mejor valor de cada
// columna numérica (sirve para comparar jugadores de un vistazo).
//
//   columns   definiciones de statsSchema.js
//   rows      objetos con esas claves
//   lead      columna fija opcional: { label, render(row), sortValue(row) }

const thStyle = {
  fontFamily: 'mono', fontSize: '10px', letterSpacing: 'wider', color: 'brand.gray',
  borderColor: 'brand.brownDark', px: 2.5, py: 2.5, whiteSpace: 'nowrap', cursor: 'pointer',
  userSelect: 'none', bg: 'brand.dark2', position: 'sticky', top: 0, zIndex: 1,
}

const tdStyle = { borderColor: 'brand.brownDark', px: 2.5, py: 2, fontSize: 'sm', whiteSpace: 'nowrap' }

export default function DataTable({
  columns, rows, rowKey, lead, defaultSort = null, highlight = false, onRowClick, maxH = '70vh', emptyText = 'Sin datos',
}) {
  const [sort, setSort] = useState(defaultSort) // { key, dir }

  const sorted = useMemo(() => {
    if (!sort) return rows
    if (sort.key === '__lead') {
      const col = { kind: 'text', get: lead.sortValue }
      return [...rows].sort(compareBy(col, sort.dir))
    }
    const col = columns.find((c) => c.key === sort.key)
    return col ? [...rows].sort(compareBy(col, sort.dir)) : rows
  }, [rows, columns, sort, lead])

  // Mejor valor por columna (sólo con 2 filas o más, si no no compara nada).
  const best = useMemo(() => {
    if (!highlight || rows.length < 2) return {}
    const out = {}
    columns.forEach((c) => {
      if (c.kind === 'text' || c.kind === 'date') return
      const values = rows.map((r) => cellValue(r, c)).filter((v) => v !== null).map(Number)
      if (values.length < 2) return
      const min = Math.min(...values)
      const max = Math.max(...values)
      // Si todos tienen lo mismo no hay a quién destacar.
      if (min === max) return
      out[c.key] = c.lowerIsBetter ? min : max
    })
    return out
  }, [rows, columns, highlight])

  const toggle = (key, kind) => {
    setSort((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      return { key, dir: kind === 'text' ? 'asc' : 'desc' }
    })
  }

  const SortIcon = ({ k }) => (sort?.key === k ? (sort.dir === 'desc' ? <FiChevronDown /> : <FiChevronUp />) : null)

  if (!rows.length) {
    return (
      <Box border="1px dashed" borderColor="brand.brownDark" borderRadius="lg" p={6} textAlign="center">
        <Text fontSize="sm" color="brand.gray">{emptyText}</Text>
      </Box>
    )
  }

  return (
    <Box
      overflow="auto" maxH={maxH} border="1px solid" borderColor="brand.brownDark" borderRadius="lg"
      bg="brand.dark"
    >
      <Table size="sm" variant="unstyled" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <Thead>
          <Tr>
            {lead && (
              <Th {...thStyle} left={0} zIndex={2} borderBottom="1px solid" borderBottomColor="brand.brownDark" borderRight="1px solid" borderRightColor="brand.brownDark" onClick={() => toggle('__lead', 'text')}>
                <HStack spacing={1}><span>{lead.label}</span><SortIcon k="__lead" /></HStack>
              </Th>
            )}
            {columns.map((c) => (
              <Th key={c.key} {...thStyle} borderBottom="1px solid" borderBottomColor="brand.brownDark"
                onClick={() => toggle(c.key, c.kind)} color={sort?.key === c.key ? 'brand.orange' : 'brand.gray'}>
                <Tooltip label={c.label} openDelay={400} hasArrow>
                  <HStack spacing={1} justify={c.kind === 'text' || c.kind === 'date' ? 'flex-start' : 'flex-end'}>
                    <span>{c.short}</span><SortIcon k={c.key} />
                  </HStack>
                </Tooltip>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {sorted.map((row, i) => (
            <Tr
              key={rowKey(row, i)}
              cursor={onRowClick ? 'pointer' : 'default'}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              _hover={{ '& > td': { bg: 'brand.brownLight' } }}
            >
              {lead && (
                <Td {...tdStyle} position="sticky" left={0} zIndex={1} bg="brand.dark2" borderBottom="1px solid" borderBottomColor="brand.brownDark" borderRight="1px solid" borderRightColor="brand.brownDark">
                  {lead.render(row)}
                </Td>
              )}
              {columns.map((c) => {
                const v = cellValue(row, c)
                const isBest = best[c.key] !== undefined && v !== null && Number(v) === best[c.key]
                return (
                  <Td key={c.key} {...tdStyle} borderBottom="1px solid" borderBottomColor="brand.brownDark" bg="brand.dark"
                    textAlign={c.kind !== 'text' && c.kind !== 'date' ? 'right' : 'left'}
                    color={isBest ? 'brand.orange' : v === null ? 'brand.gray' : 'white'}
                    fontWeight={isBest ? 'bold' : 'normal'}>
                    {formatCell(v, c)}
                  </Td>
                )
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
