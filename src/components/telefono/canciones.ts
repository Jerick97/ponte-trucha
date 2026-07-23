/**
 * Pistas de musica de la pantalla de bloqueo. Se detectan solas: cualquier
 * archivo de audio que caiga en src/assets/audio aparece en el reproductor
 * (el nombre del archivo se vuelve el titulo). Si hay una imagen en la misma
 * carpeta cuyo nombre empieza igual, se usa como caratula.
 */

const audios = import.meta.glob('../../assets/audio/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const caratulas = import.meta.glob('../../assets/audio/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface Cancion {
  titulo: string;
  src: string;
  caratula?: string;
}

/** Nombre de archivo normalizado: sin carpeta, sin extension, en minusculas. */
function clave(ruta: string): string {
  const nombre = ruta.split('/').pop() ?? ruta;
  return nombre
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function tituloDesdeRuta(ruta: string): string {
  const nombre = clave(ruta);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

function caratulaPara(rutaAudio: string): string | undefined {
  const nombreAudio = clave(rutaAudio);
  const pareja = Object.entries(caratulas).find(([rutaImagen]) => {
    const nombreImagen = clave(rutaImagen);
    return nombreImagen.startsWith(nombreAudio) || nombreAudio.startsWith(nombreImagen);
  });
  return pareja?.[1];
}

export const CANCIONES: Cancion[] = Object.entries(audios)
  .map(([ruta, src]) => ({ titulo: tituloDesdeRuta(ruta), src, caratula: caratulaPara(ruta) }))
  .sort((a, b) => a.titulo.localeCompare(b.titulo));
