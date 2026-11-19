import { useState } from 'react'
import { Button, Menu, MenuButton, MenuList, MenuItem, useToast } from '@chakra-ui/react'
import { FiDownload, FiFileText, FiGrid } from 'react-icons/fi'
import { downloadCsv, downloadXlsx } from '../../lib/exporters'

// Botón "Exportar" con CSV y Excel.
//   name    nombre del archivo, sin extensión
//   sheets  [{ sheet, columns, rows }] — el CSV usa la primera hoja; el
//           Excel lleva todas, una por pestaña.
export default function ExportMenu({ name, sheets, isDisabled }) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const empty = !sheets?.some((s) => s.rows.length)

  const xlsx = async () => {
    setBusy(true)
    try {
      await downloadXlsx(name, sheets.filter((s) => s.rows.length))
    } catch (err) {
      toast({ title: 'No se pudo generar el Excel', description: err.message, status: 'error', duration: 5000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button} size="sm" leftIcon={<FiDownload />} isLoading={busy} isDisabled={isDisabled || empty}
        fontFamily="mono" fontSize="xs" letterSpacing="widest" textTransform="uppercase"
        bg="brand.amber" color="brand.brown" _hover={{ bg: 'brand.orange' }} _active={{ bg: 'brand.orange' }}
      >
        Exportar
      </MenuButton>
      <MenuList bg="brand.dark2" borderColor="brand.brownDark" fontSize="sm" zIndex={30}>
        <MenuItem icon={<FiGrid />} bg="transparent" _hover={{ bg: 'brand.brownLight' }} onClick={xlsx}>
          Excel (.xlsx){sheets.length > 1 ? ` · ${sheets.length} hojas` : ''}
        </MenuItem>
        <MenuItem icon={<FiFileText />} bg="transparent" _hover={{ bg: 'brand.brownLight' }}
          onClick={() => downloadCsv(name, sheets[0].columns, sheets[0].rows)}>
          CSV{sheets.length > 1 ? ` · ${sheets[0].sheet}` : ''}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
