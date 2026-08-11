// Estilos compartidos de formularios, portados del AdminPage de las
// landings para mantener el mismo criterio visual.

export const labelStyle = {
  fontFamily: 'mono',
  fontSize: '10px',
  color: 'brand.gray',
  textTransform: 'uppercase',
  letterSpacing: 'widest',
  mb: 1,
}

export const inputStyle = {
  bg: 'brand.dark',
  border: '1px solid',
  borderColor: 'brand.brownDark',
  borderRadius: 'md',
  fontFamily: 'mono',
  fontSize: 'sm',
  color: 'white',
  h: '42px',
  _hover: { borderColor: 'brand.gray' },
  _focus: { borderColor: 'brand.amber', boxShadow: '0 0 0 1px rgba(219,204,175,0.4)' },
  _placeholder: { color: 'rgba(175,160,141,0.5)' },
}
