import { useState, useEffect, useRef } from 'react'
import { Flex, Text, Image, Input, FormControl, FormLabel, useToken } from '@chakra-ui/react'
import { FiUpload } from 'react-icons/fi'
import { labelStyle } from '../ui/formStyles'

export default function ShieldUpload({ label, currentUrl, onFileChange }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [grayColor] = useToken('colors', ['brand.gray'])

  // Cuando el escudo guardado cambia (post-guardado o cambio de jugador)
  // soltamos el blob local: ya no representa lo que hay en Firestore.
  useEffect(() => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [currentUrl])

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    onFileChange(file)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const displayUrl = preview || currentUrl

  return (
    <FormControl>
      <FormLabel {...labelStyle}>{label}</FormLabel>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={handleChange}
      />
      <Flex
        align="center"
        gap={3}
        p={2}
        border="1px dashed"
        borderColor="brand.brownDark"
        borderRadius="md"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: 'brand.amber', bg: 'brand.amberLight' }}
        onClick={() => inputRef.current?.click()}
        minH="56px"
      >
        {displayUrl ? (
          <Image src={displayUrl} boxSize="40px" objectFit="contain" borderRadius="sm" />
        ) : (
          <Flex boxSize="40px" align="center" justify="center" bg="brand.brownDark" borderRadius="sm">
            <FiUpload color={grayColor} size={16} />
          </Flex>
        )}
        <Text fontFamily="mono" fontSize="11px" color="brand.gray">
          {displayUrl ? 'Cambiar imagen' : 'Subir escudo'}
        </Text>
      </Flex>
    </FormControl>
  )
}
