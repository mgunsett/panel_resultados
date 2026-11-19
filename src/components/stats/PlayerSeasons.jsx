import { useMemo } from 'react'
import { Text } from '@chakra-ui/react'
import { FiLayers } from 'react-icons/fi'
import { SEASON_COLUMNS, PER90_COLUMNS } from '../../lib/statsSchema'
import { exportFileName } from '../../lib/exporters'
import DataTable from './DataTable'
import ExportMenu from './ExportMenu'
import SectionCard from './SectionCard'

const YEAR_COL = { key: 'temporada', label: 'Temporada', short: 'Temp.', kind: 'text' }
const COMP_COLUMNS = [
  YEAR_COL,
  { key: 'nombre', label: 'Competición', short: 'Competición', kind: 'text' },
  { key: 'club', label: 'Club', short: 'Club', kind: 'text' },
  { key: 'partidos', label: 'Partidos jugados', short: 'PJ', kind: 'num' },
  { key: 'minutos', label: 'Minutos', short: 'Min', kind: 'num' },
  { key: 'goles', label: 'Goles', short: 'G', kind: 'num' },
  { key: 'asistencias', label: 'Asistencias', short: 'A', kind: 'num' },
]

// Pestaña "Temporadas": totales año por año y desglose por competición.
export default function PlayerSeasons({ player, stats }) {
  const rows = useMemo(
    () => Object.entries(stats.seasons).map(([year, s]) => ({ ...s, temporada: String(year) })),
    [stats],
  )
  const comps = useMemo(
    () => rows.flatMap((s) => (s.competiciones || []).map((c) => ({ ...c, temporada: s.temporada }))),
    [rows],
  )

  return (
    <>
      <SectionCard
        title="Temporadas" icon={FiLayers}
        right={
          <ExportMenu name={exportFileName(player.slug, 'temporadas')} sheets={[
            { sheet: 'Temporadas', columns: [YEAR_COL, ...SEASON_COLUMNS, ...PER90_COLUMNS], rows },
            { sheet: 'Por competición', columns: COMP_COLUMNS, rows: comps },
          ]} />
        }
      >
        <DataTable
          columns={[...SEASON_COLUMNS, ...PER90_COLUMNS]}
          rows={rows}
          rowKey={(r) => r.temporada}
          lead={{ label: 'Temp.', render: (r) => <Text fontFamily="heading" fontSize="lg" color="white">{r.temporada}</Text>, sortValue: (r) => r.temporada }}
          defaultSort={{ key: '__lead', dir: 'desc' }}
          highlight
          emptyText='Todavía no hay totales guardados. La temporada en curso se carga sola; las anteriores, con "Traer temporadas anteriores" en Sincronización.'
        />
      </SectionCard>

      {comps.length > 0 && (
        <SectionCard title="Por competición">
          <DataTable columns={COMP_COLUMNS} rows={comps} rowKey={(r, i) => `${r.temporada}-${r.nombre}-${i}`}
            defaultSort={{ key: 'temporada', dir: 'desc' }} />
        </SectionCard>
      )}
    </>
  )
}
