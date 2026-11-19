import { Select } from '@chakra-ui/react'
import { inputStyle } from '../ui/formStyles'

export default function SeasonSelect({ seasons, value, onChange, w = '130px' }) {
  return (
    <Select {...inputStyle} size="sm" h="32px" w={w} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
      {seasons.map((y) => (
        <option key={y} value={y} style={{ background: '#1E1B19' }}>Temporada {y}</option>
      ))}
    </Select>
  )
}
