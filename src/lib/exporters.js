import { cellValue } from './statsSchema'

// ─── EXPORTAR A CSV / EXCEL ──────────────────────────────────────
// Reciben las mismas columnas que las tablas (statsSchema.js) y las
// filas como objetos. Los valores van crudos (números como números)
// para que se puedan sumar y graficar en Excel o Google Sheets.

function slugify(text) {
  return String(text || 'export')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function exportFileName(...parts) {
  const today = new Date().toISOString().slice(0, 10)
  return `${parts.filter(Boolean).map(slugify).join('_')}_${today}`
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// CSV con punto y coma y coma decimal: es lo que abre directo, sin
// asistente de importación, un Excel configurado en español. El BOM
// hace que respete las tildes.
export function downloadCsv(name, columns, rows) {
  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v)
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    columns.map((c) => esc(c.label)).join(';'),
    ...rows.map((row) => columns.map((c) => esc(cellValue(row, c))).join(';')),
  ]
  download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
}

// Excel real (.xlsx), con una o varias hojas: [{ sheet, columns, rows }].
// La librería se carga recién al exportar, así no pesa en el resto del panel.
export async function downloadXlsx(name, sheets) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const data = sheets.map(({ sheet, columns, rows }) => ({
    sheet: String(sheet).slice(0, 31),
    stickyRowsCount: 1,
    columns: columns.map((c) => ({ width: Math.max(8, Math.min(28, c.label.length + 2)) })),
    data: [
      columns.map((c) => ({ value: c.label, fontWeight: 'bold' })),
      ...rows.map((row) => columns.map((c) => {
        const v = cellValue(row, c)
        return v === undefined ? null : v
      })),
    ],
  }))
  await writeExcelFile(data).toFile(`${name}.xlsx`)
}
