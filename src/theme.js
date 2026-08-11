import { extendTheme } from '@chakra-ui/react'

// ─── PALETA DEL PANEL ────────────────────────────────────────────
// Mismos nombres de tokens que usan las landings (brand.dark,
// brand.amber, brand.brownDark, …) para que los componentes
// portados desde AdminPage.jsx funcionen sin tocar los estilos.
const brand = {
  brown: '#171514', // base casi negra cálida
  brownDark: '#2A2522', // bordes / divisores
  brownLight: '#3B322E', // sombra marrón cálida
  amber: '#DBCCAF', // arena/dorado apagado (bordes/títulos)
  amberDark: '#8F7B54',
  amberLight: '#C2AC824F', // arena translúcida
  dark: '#151312', // fondo del panel (sólido, sin alpha)
  dark2: '#1E1B19', // superficies elevadas (tarjetas)
  gray: '#AFA08D', // texto secundario
  bone: '#FFFFFF', // texto principal
  rec: '#E5484D', // errores / acciones destructivas
}

const theme = extendTheme({
  colors: { brand },
  fonts: {
    heading: "'Bebas Neue', sans-serif",
    body: "'Barlow', sans-serif",
    mono: "'Barlow Condensed', sans-serif",
  },
  styles: {
    global: {
      'html, body': {
        bg: brand.dark,
        color: brand.bone,
        overflowX: 'hidden',
      },
      '::-webkit-scrollbar': { width: '4px' },
      '::-webkit-scrollbar-track': { bg: brand.dark },
      '::-webkit-scrollbar-thumb': { bg: brand.amber, borderRadius: '2px' },
    },
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
})

export default theme
