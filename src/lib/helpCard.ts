/** 10 digitos con 11 adelante: 11 5555-1234; el resto de las areas: 351 555-1234. Otro largo: tal cual. */
export function formatPhone(digits: string): string {
  if (digits.length !== 10) return digits;
  return digits.startsWith('11')
    ? `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`
    : `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** wa.me pide el numero internacional: un celular argentino de 10 digitos lleva 549 adelante. */
export function whatsappUrl(digits: string): string {
  return `https://wa.me/${digits.length === 10 ? `549${digits}` : digits}`;
}

/** Token de la ruta publica /tarjeta/:token, o null si la ruta es otra. */
export function helpCardTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/tarjeta\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
