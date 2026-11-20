import { useState } from 'react'
import { Box, Button, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { FiCheck, FiCopy, FiDownload } from 'react-icons/fi'
import { PLAYER_COLUMNS } from '../../lib/statsSchema'
import { downloadCsv, downloadXlsx, exportFileName } from '../../lib/exporters'
import { fmtInt } from '../../lib/profileData'
import { ALL_P90_COLUMNS, ALL_TOTAL_COLUMNS, LAST_MATCH_COLUMNS, toTsv } from '../../lib/statsBoard'

const OPT = (on) => ({
  as: 'button', type: 'button', role: 'radio', 'aria-checked': on, w: '100%', textAlign: 'left',
  display: 'flex', alignItems: 'center', gap: 3, px: 3.5, py: 3, minH: '56px', borderRadius: '12px',
  border: '1px solid', borderColor: on ? 'brand.orange' : '#3a2f27', bg: on ? 'rgba(249,160,63,.1)' : '#0f0c0a',
  _hover: { borderColor: on ? 'brand.orange' : 'brand.gray' },
  _focusVisible: { outline: '2px solid', outlineColor: 'brand.orange', outlineOffset: '2px' },
})

function Radio({ on }) {
  return (
    <Flex boxSize="18px" borderRadius="full" border="2px solid" borderColor={on ? 'brand.orange' : '#5a4f47'} align="center" justify="center" flexShrink={0}>
      <Box boxSize="8px" borderRadius="full" bg={on ? 'brand.orange' : 'transparent'} />
    </Flex>
  )
}

function FileIcon({ ext, big }) {
  return (
    <Flex w={big ? '48px' : '40px'} h={big ? '56px' : '40px'} borderRadius={big ? '8px' : '9px'} align="center" justify="center" flexShrink={0}
      bg={ext === 'XLS' ? '#1f6e43' : '#5a4f47'} fontFamily="mono" fontWeight="700" fontSize={big ? '14px' : '13px'} letterSpacing="0.06em">
      {ext}
    </Flex>
  )
}

function Step({ n, title, children, ...rest }) {
  return (
    <Flex direction="column" gap={2} minW={0} {...rest}>
      <Flex align="center" gap={2} mb={0.5} fontFamily="mono" fontSize="14px" letterSpacing="0.14em" textTransform="uppercase" color="brand.amber">
        <Flex boxSize="22px" borderRadius="full" bg="brand.orange" color="brand.brown" align="center" justify="center" fontSize="13px" fontWeight="700" letterSpacing={0}>{n}</Flex>
        {title}
      </Flex>
      {children}
    </Flex>
  )
}

// ─── EXPORTAR EN 3 PASOS ─────────────────────────────────────────
// Formato, qué incluir y un resumen del archivo antes de bajarlo.
// La hoja principal es exactamente lo que muestra la tabla (filtro,
// búsqueda y orden); las hojas extra respetan el club y la búsqueda.
//
//   tableRows / tableColumns   lo que se ve en la tabla
//   baseRows                   jugadores del filtro (sin el mínimo de minutos)
//   lastRows / matchRows       último partido y partidos de la temporada
export default function ExportPanel({
  tableRows, tableColumns, baseRows, lastRows, matchRows, p90, season, clubLabel, clubSlug, query, groupLabel,
}) {
  const [format, setFormat] = useState('xlsx')
  const [scope, setScope] = useState('vista')
  const [extra, setExtra] = useState({ otra: true, ultimo: true, partidos: false })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const xlsx = format === 'xlsx'

  const mainColumns = scope === 'vista' ? [...PLAYER_COLUMNS, ...tableColumns] : p90 ? ALL_P90_COLUMNS : ALL_TOTAL_COLUMNS
  const mainSheet = { sheet: `${p90 ? 'Cada 90' : 'Temporada'} ${season}`, columns: mainColumns, rows: tableRows }
  const extras = [
    { id: 'otra', label: p90 ? `Totales ${season}` : `Cada 90' ${season}`, sheet: { sheet: `${p90 ? 'Temporada' : 'Cada 90'} ${season}`, columns: p90 ? ALL_TOTAL_COLUMNS : ALL_P90_COLUMNS, rows: baseRows } },
    { id: 'ultimo', label: 'Último partido de cada uno', sheet: { sheet: 'Último partido', columns: LAST_MATCH_COLUMNS, rows: lastRows } },
    { id: 'partidos', label: `Todos los partidos ${season}`, sheet: { sheet: `Partidos ${season}`, columns: LAST_MATCH_COLUMNS, rows: matchRows } },
  ]
  const sheets = [mainSheet, ...(xlsx ? extras.filter((x) => extra[x.id] && x.sheet.rows.length).map((x) => x.sheet) : [])]
  const name = exportFileName('estadisticas', clubSlug || 'todos', season, p90 ? 'c90' : null)
  const empty = !tableRows.length

  const set = (fn) => (...a) => { setDone(null); fn(...a) }

  const download = async () => {
    setBusy(true)
    setDone(null)
    try {
      if (xlsx) await downloadXlsx(name, sheets)
      else downloadCsv(name, mainSheet.columns, mainSheet.rows)
      setDone({ ok: true, text: `Listo, se descargó ${name}.${format}. Lo encontrás en la carpeta Descargas.` })
    } catch (err) {
      setDone({ ok: false, text: `No se pudo generar el archivo: ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    setDone(null)
    try {
      await navigator.clipboard.writeText(toTsv(mainSheet.columns, mainSheet.rows))
      setDone({ ok: true, text: `Copiamos ${tableRows.length} filas. Pegalas con Ctrl+V en Excel o Google Sheets.` })
    } catch {
      setDone({ ok: false, text: 'El navegador no dejó copiar. Probá con Descargar.' })
    }
  }

  const lines = [
    `${tableRows.length} ${tableRows.length === 1 ? 'jugador' : 'jugadores'} × ${mainColumns.length} columnas${scope === 'vista' ? ` (${groupLabel})` : ''}`,
    xlsx ? `${sheets.length} ${sheets.length === 1 ? 'hoja' : 'hojas'}: ${sheets.map((s) => s.sheet).join(' · ')}` : 'Una sola tabla, separada por punto y coma',
    `Filtro: ${clubLabel} · ${p90 ? `cada 90' (450' o más)` : 'totales'}${query ? ` · búsqueda «${query}»` : ''}`,
  ]

  return (
    <SimpleGrid id="exportar" minChildWidth="280px" spacing={4} px={5} pt={4} pb={5} bg="linear-gradient(180deg, #140f0b, #050404)" borderTop="1px solid" borderColor="rgba(249,160,63,.25)">
      <Step n={1} title="Formato" role="radiogroup" aria-label="Formato">
        {[['xlsx', 'XLS', 'Excel', 'Se abre en Excel o Google Sheets, con varias hojas'], ['csv', 'CSV', 'CSV', 'Texto simple para otras herramientas']].map(([id, ext, title, desc]) => (
          <Box key={id} {...OPT(format === id)} onClick={set(() => setFormat(id))}>
            <FileIcon ext={ext} />
            <Box flex={1} minW={0}>
              <Text fontSize="15px" fontWeight="600">{title}</Text>
              <Text fontSize="13px" color="brand.gray">{desc}</Text>
            </Box>
            <Radio on={format === id} />
          </Box>
        ))}
      </Step>

      <Step n={2} title="Qué incluir">
        <Flex direction="column" gap={2} role="radiogroup" aria-label="Qué incluir">
          {[['vista', 'Lo que ves en la tabla', `${tableRows.length} jugadores · columnas de ${groupLabel}, en el mismo orden`],
            ['todo', 'Todas las columnas', `${tableRows.length} jugadores · ${(p90 ? ALL_P90_COLUMNS : ALL_TOTAL_COLUMNS).length} columnas de estadísticas`]].map(([id, title, desc]) => (
            <Box key={id} {...OPT(scope === id)} onClick={set(() => setScope(id))}>
              <Box flex={1} minW={0}>
                <Text fontSize="15px" fontWeight="600">{title}</Text>
                <Text fontSize="13px" color="brand.gray">{desc}</Text>
              </Box>
              <Radio on={scope === id} />
            </Box>
          ))}
        </Flex>
        {xlsx ? (
          <>
            <Text mt={1.5} fontFamily="mono" fontSize="12px" letterSpacing="0.16em" textTransform="uppercase" color="brand.gray">Sumar hojas al Excel</Text>
            {extras.map((x) => {
              const on = extra[x.id]
              return (
                <Flex
                  key={x.id} as="button" type="button" role="checkbox" aria-checked={on} align="center" gap={2.5} minH="40px" px={1} borderRadius="8px"
                  textAlign="left" fontSize="14px" _hover={{ bg: '#17120e' }} _focusVisible={{ outline: '2px solid', outlineColor: 'brand.orange' }}
                  onClick={set(() => setExtra({ ...extra, [x.id]: !on }))}
                >
                  <Flex boxSize="20px" borderRadius="5px" border="2px solid" borderColor={on ? 'brand.orange' : '#5a4f47'} bg={on ? 'brand.orange' : 'transparent'}
                    color="brand.brown" align="center" justify="center" flexShrink={0}>{on && <FiCheck size={13} strokeWidth={3} />}</Flex>
                  <Text flex={1}>{x.label}</Text>
                  <Text fontSize="13px" color="#8c7f70">{x.sheet.rows.length ? `${fmtInt(x.sheet.rows.length)} filas` : 'sin datos'}</Text>
                </Flex>
              )
            })}
          </>
        ) : (
          <Text mt={1} fontSize="13px" color="#8c7f70">El CSV lleva una sola tabla. Para sumar más hojas, elegí Excel.</Text>
        )}
      </Step>

      <Step n={3} title="Tu archivo" p={4} borderRadius="14px" bg="#0f0c0a" border="1px solid" borderColor="rgba(249,160,63,.3)" gap={3}>
        <Flex align="center" gap={3}>
          <FileIcon ext={xlsx ? 'XLS' : 'CSV'} big />
          <Box minW={0}>
            <Text fontSize="16px" fontWeight="700" wordBreak="break-all">{name}.{format}</Text>
            <Text fontSize="13px" color="brand.gray">{xlsx ? 'Excel (.xlsx)' : 'CSV (.csv)'}</Text>
          </Box>
        </Flex>
        <Flex as="ul" listStyleType="none" direction="column" gap={1.5} fontSize="14px" color="brand.amber">
          {lines.map((l) => <Flex as="li" key={l} gap={2}><Text as="span" color="brand.orange">•</Text>{l}</Flex>)}
        </Flex>
        <Button
          leftIcon={<FiDownload />} onClick={download} isLoading={busy} isDisabled={empty} w="100%" minH="50px"
          bg="brand.orange" color="brand.brown" _hover={{ bg: '#ffb35e' }} _active={{ bg: '#ffb35e' }}
          fontFamily="mono" fontSize="15px" letterSpacing="0.12em" textTransform="uppercase"
        >
          Descargar {xlsx ? 'Excel' : 'CSV'}
        </Button>
        <Button
          leftIcon={<FiCopy />} onClick={copy} isDisabled={empty} variant="outline" w="100%" minH="40px" whiteSpace="normal" h="auto" py={2}
          borderColor="#423a35" color="brand.amber" _hover={{ bg: '#2a2420', color: 'white' }}
          fontFamily="mono" fontSize="13px" letterSpacing="0.1em" textTransform="uppercase" fontWeight="normal"
        >
          Copiar la tabla para pegar en Excel o Sheets
        </Button>
        {done && (
          <Flex role="status" gap={2} px={3} py={2.5} borderRadius="10px" fontSize="14px"
            bg={done.ok ? '#1f2b22' : '#2b1f1f'} border="1px solid" borderColor={done.ok ? '#2f4a37' : '#4a2f2f'} color={done.ok ? '#8fe3ae' : '#f2a7a7'}>
            {done.ok ? '✓' : '!'} {done.text}
          </Flex>
        )}
      </Step>
    </SimpleGrid>
  )
}
