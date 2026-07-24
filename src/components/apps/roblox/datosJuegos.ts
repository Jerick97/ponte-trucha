/**
 * Catalogo de juegos de la app Roblox del simulador: los 7 juegos reales
 * que paso Jerick (iconos, capturas del slider y ficha de la pagina
 * oficial). Son decorativos: dan realismo al Home y al detalle.
 */

import iconoForsaken from '../../../assets/img/roblox/games/Game1.webp';
import iconoBrookhaven from '../../../assets/img/roblox/games/Game2.webp';
import iconoFutbol from '../../../assets/img/roblox/games/Game3.webp';
import iconoTinta from '../../../assets/img/roblox/games/Game4.webp';
import iconoDinosaurio from '../../../assets/img/roblox/games/Game5.webp';
import iconoFalsitud from '../../../assets/img/roblox/games/Game6.webp';
import iconoKingpin from '../../../assets/img/roblox/games/Game7.webp';

import azure1 from '../../../assets/img/roblox/games/azure/azure.webp';
import azure2 from '../../../assets/img/roblox/games/azure/azure2.webp';
import azure3 from '../../../assets/img/roblox/games/azure/azure3.webp';
import azureEvento1 from '../../../assets/img/roblox/games/azure/evento1.jpg';
import azureEmblema from '../../../assets/img/roblox/games/azure/emblemas/emblema.webp';
import brookhaven1 from '../../../assets/img/roblox/games/brookhaven/brookhaven.webp';
import brookhaven2 from '../../../assets/img/roblox/games/brookhaven/brookhaven2.webp';
import brookhaven3 from '../../../assets/img/roblox/games/brookhaven/brookhaven3.webp';
import brookhavenEvento1 from '../../../assets/img/roblox/games/brookhaven/evento1.jpg';
import brookhavenEvento2 from '../../../assets/img/roblox/games/brookhaven/evento2.jpg';
import futbol1 from '../../../assets/img/roblox/games/futbol/futbol.webp';
import futbol2 from '../../../assets/img/roblox/games/futbol/futbol2.webp';
import futbol3 from '../../../assets/img/roblox/games/futbol/futbol3.webp';
import futbolEmblema1 from '../../../assets/img/roblox/games/futbol/emblemas/emblema1.webp';
import tinta1 from '../../../assets/img/roblox/games/tinta/tinta.webp';
import tinta2 from '../../../assets/img/roblox/games/tinta/tinta2.webp';
import tinta3 from '../../../assets/img/roblox/games/tinta/tinta3.webp';
import dinosaurio1 from '../../../assets/img/roblox/games/dinosaurio/dinosaurio.webp';
import dinosaurio2 from '../../../assets/img/roblox/games/dinosaurio/dinosaurio2.webp';
import dinosaurio3 from '../../../assets/img/roblox/games/dinosaurio/dinosaurio3.webp';
import dinosaurioEvento1 from '../../../assets/img/roblox/games/dinosaurio/eventos/evento1.jpg';
import falsitud1 from '../../../assets/img/roblox/games/verity/falsitud.webp';
import falsitud2 from '../../../assets/img/roblox/games/verity/falsitud2.webp';
import falsitud3 from '../../../assets/img/roblox/games/verity/falsitud3.webp';
import falsitudEvento1 from '../../../assets/img/roblox/games/verity/eventos/evento1.jpg';
import kingpin1 from '../../../assets/img/roblox/games/kingpin/kingpin.webp';
import kingpin2 from '../../../assets/img/roblox/games/kingpin/kingpin2.webp';
import kingpin3 from '../../../assets/img/roblox/games/kingpin/kingpin3.webp';
import kingpinEvento1 from '../../../assets/img/roblox/games/kingpin/eventos/evento1.jpg';
import kingpinEvento2 from '../../../assets/img/roblox/games/kingpin/eventos/evento2.jpg';
import kingpinEvento3 from '../../../assets/img/roblox/games/kingpin/eventos/evento3.jpg';

import tintaEvento from '../../../assets/img/roblox/games/tinta/evento.jpg';

/**
 * Las 14 insignias del Juego de tinta, autodetectadas por nombre de
 * archivo (emblema0..emblema13). El orden real lo fija EMBLEMAS_TINTA.
 */
const ARCHIVOS_EMBLEMAS = import.meta.glob('../../../assets/img/roblox/games/tinta/emblemas/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const ARCHIVOS_EMBLEMAS_KINGPIN = import.meta.glob('../../../assets/img/roblox/games/kingpin/emblemas/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function buscarEmblema(archivos: Record<string, string>, numero: number): string {
  const ruta = Object.keys(archivos).find((r) => r.endsWith(`/emblema${numero}.webp`));
  return ruta ? archivos[ruta] : '';
}

const emblema = (numero: number) => buscarEmblema(ARCHIVOS_EMBLEMAS, numero);
const emblemaKp = (numero: number) => buscarEmblema(ARCHIVOS_EMBLEMAS_KINGPIN, numero);

export interface EmblemaRb {
  imagen: string;
  nombre: string;
  subtitulo?: string;
  rareza: string;
  ganadasAyer: string;
  ganadasTotal: string;
}

export interface EventoRb {
  imagen: string;
  /** Chip sobre la imagen: fecha o "En curso". */
  chip: string;
  nombre: string;
  subtitulo: string;
}

/** Ficha extendida (textos de la pagina oficial del juego). */
export interface DetalleRb {
  eventos?: EventoRb[];
  descripcion: string[];
  /** Filas de la seccion Informacion, como en la app movil. */
  info: {
    visitas: string;
    tamanoServidor: string;
    genero: string;
    subgenero?: string;
    creada: string;
    actualizada: string;
    chatVoz: string;
    camara: string;
  };
  emblemas?: EmblemaRb[];
}

export interface JuegoRb {
  id: string;
  nombre: string;
  creador: string;
  verificado: boolean;
  madurez: 'Mínima' | 'Leve';
  /** Porcentaje de valoracion positiva (pulgar arriba). */
  valoracion: number;
  /** Jugadores activos, ya formateado como en la app. */
  activos: string;
  icono: string;
  /** Tres capturas para el slider del detalle. */
  capturas: [string, string, string];
  /** Ficha completa; si falta, el detalle muestra solo lo basico. */
  detalle?: DetalleRb;
}

export const JUEGOS_RB: JuegoRb[] = [
  {
    id: 'brookhaven',
    nombre: 'Brookhaven 🏡 RP',
    creador: 'Brookhaven by Voldex',
    verificado: false,
    madurez: 'Mínima',
    valoracion: 85,
    activos: '522 mil',
    icono: iconoBrookhaven,
    capturas: [brookhaven1, brookhaven2, brookhaven3],
    detalle: {
      eventos: [
        {
          imagen: brookhavenEvento1,
          chip: 'En curso',
          nombre: '☀️ SUMMER CARNIVAL! 🎪',
          subtitulo: "IT'S BACK!",
        },
        {
          imagen: brookhavenEvento2,
          chip: 'vie., jul. 24 a la(s) 13:00',
          nombre: '☀️ SUMMER CARNIVAL! 🏁🏎️',
          subtitulo: 'Go Karts & new Prizes!',
        },
      ],
      descripcion: [
        'Un lugar para jugar con personas de ideas afines y hacer juegos de rol. Posee y vive en casas increíbles, conduce vehículos geniales y explora la ciudad. Sé quien quieras ser en Brookhaven RP.',
        'Última actualización:',
        '🎪 Carnaval de verano - ¡Gana entradas jugando minijuegos y atracciones de carnaval!',
        '🎡 Atracciones de la semana 1 - Aros de baloncesto, Rueda de Brook, El Yell-o-Vator, Explosión de globos y Canción de verano de Skye!',
        '🎟️ Recompensas de boletos de la semana 1 - ¡7 nuevas herramientas, 2 nuevos accesorios y un nuevo vehículo!',
        '🪙 Paquete y artículos VIP - ¡Nuevo paquete de casa y vehículo de carnaval! ¡Nuevo vehículo VIP!',
        '📆 La próxima semana... ¡Go Karts y más!',
        '¡Gracias por jugar!',
        'Beneficios de servidor privado:\n· Guardado de objetos\n· Música de todo el servidor\n· Anuncios de todo el servidor\n· Eliminar o bloquear objetos\n· Comprobar propietarios de objetos\n· Establecer jugadores como administradores\n· Expulsar / Banear temporalmente a los jugadores\n· Establecer día de la semana\n· Establecer hora por hora\n· Cambiar el clima y la iluminación\n· Acelerar el tiempo\n· Controles de tema del servidor\n· Sin tiempo de espera para cambiar de casa\n· Genera hasta tres vehículos\n· Límite de objetos aumentado\n· Freecam para usuarios de PC (Shift+P)',
      ],
      info: {
        visitas: '85.400 M',
        tamanoServidor: '28',
        genero: 'Juegos de rol y simulación de avatar',
        subgenero: 'Vida',
        creada: '20/4/2020',
        actualizada: '22/7/2026',
        chatVoz: 'No compatible',
        camara: 'No compatible',
      },
    },
  },
  {
    id: 'forsaken',
    nombre: '[AZURE] Abandonado',
    creador: 'Forsaken Dev Team',
    verificado: true,
    madurez: 'Leve',
    valoracion: 84,
    activos: '96,2 mil',
    icono: iconoForsaken,
    capturas: [azure1, azure2, azure3],
    detalle: {
      eventos: [
        {
          imagen: azureEvento1,
          chip: 'En curso',
          nombre: "Azure's Arrival...",
          subtitulo: 'Was it worth it?',
        },
      ],
      descripcion: [
        '[ ¡¡ESTE JUEGO ESTÁ EN ALFA!! ESPERA QUE TODO CAMBIE Y QUE HAYA MUCHOS ERRORES ]',
        'Bienvenido a tu prisión eterna.',
        'Entra en su reino para encontrar todo tipo de caras familiares; ya sea un amigo, un enemigo o una mezcla de ambos, seguramente los encontrarás en un momento u otro.',
        'SOBREVIVIENTES: Protege a tus compañeros de equipo, completa los objetivos y sobrevive hasta que el temporizador llegue a 0.',
        'ASESINOS: Mata a todos, no dejes a nadie en pie. Haz lo que sea necesario.',
        'Una vez que decidas entrar, no podrás volver. Esta es tu casa ahora. Abandonado para siempre.',
        '🏆 RIA 2025 Mejor Experiencia de Supervivencia',
      ],
      info: {
        visitas: '5.380 M',
        tamanoServidor: '9',
        genero: 'Supervivencia',
        subgenero: '1 contra todos',
        creada: '27/7/2024',
        actualizada: '19/7/2026',
        chatVoz: 'Compatible',
        camara: 'No compatible',
      },
      // Nombre placeholder: falta el nombre real de la insignia.
      emblemas: [
        { imagen: azureEmblema, nombre: 'Abandonado para siempre', rareza: '2.1% (De locos)', ganadasAyer: '18420', ganadasTotal: '31257904' },
      ],
    },
  },
  {
    id: 'futbol',
    nombre: 'Fútbol de calle realista',
    creador: "The Builder's Legion",
    verificado: true,
    madurez: 'Mínima',
    valoracion: 84,
    activos: '46,8 mil',
    icono: iconoFutbol,
    capturas: [futbol1, futbol2, futbol3],
    detalle: {
      descripcion: [
        'Si lees esto, deberías unirte inmediatamente.\nBienvenido a Realistic Street Soccer!',
        '💬 Únete al servidor de la comunidad a través de los enlaces sociales para estar al tanto de todas las actualizaciones.',
        'CONTROLES (PC):\nMantén el clic izquierdo - Dispara y pasa\nE - Tacleo\nQ - Regate\nShift - Correr\nCTRL - Bloqueo del ratón\nBarra espaciadora - Encabezado',
        '📱 ¡El juego ha sido diseñado de manera muy sencilla para usuarios de dispositivos móviles!',
        '🌟 Los servidores privados son gratuitos y los propietarios tienen acceso al panel de administración completo.',
        'INFO:\n🧍‍♂️ Personajes y animaciones realistas.\n🧤 Porteros de IA equilibrados.\n🕒 Juego rápido en un campo de tamaño Futsal.\n⭐ ¡Progreso guardado!',
        '🔨 Desarrollado por V_ersalty',
        '⚠️ Explotar en cuentas alternas resultará en una prohibición automática en todas tus cuentas.',
      ],
      info: {
        visitas: '1.410 M',
        tamanoServidor: '8',
        genero: 'Deportes y carreras',
        subgenero: 'Deportes',
        creada: '4/8/2023',
        actualizada: '20/7/2026',
        chatVoz: 'Compatible',
        camara: 'No compatible',
      },
      emblemas: [
        { imagen: futbolEmblema1, nombre: 'Fútbol Realista', rareza: '38.2% (Fácil)', ganadasAyer: '41230', ganadasTotal: '52318766' },
      ],
    },
  },
  {
    id: 'kingpin',
    nombre: '[💵 KINGPIN] Tower Defense Simulator',
    creador: 'Paradoxum Games',
    verificado: false,
    madurez: 'Mínima',
    valoracion: 94,
    activos: '20,8 mil',
    icono: iconoKingpin,
    capturas: [kingpin1, kingpin2, kingpin3],
    detalle: {
      eventos: [
        {
          imagen: kingpinEvento1,
          chip: 'En curso',
          nombre: 'Kingpin Tower',
          subtitulo: "Crook Boss's Final Form",
        },
        {
          imagen: kingpinEvento2,
          chip: 'vie., jul. 31 a la(s) 11:00',
          nombre: 'Story Mode',
          subtitulo: 'The Early Days',
        },
        {
          imagen: kingpinEvento3,
          chip: 'vie., ago. 14 a la(s) 11:00',
          nombre: 'Enforcer Tower',
          subtitulo: "Shotgunner's Final Form",
        },
      ],
      descripcion: [
        '💜 Thank you for 2 MILLION likes! Use code 2MILLION for a free Mercenary Pursuit skin!',
        'Place units to defend against hordes of zombies! Team up with friends and face against even stronger bosses to unlock new units!',
        '👥💵 Join the Paradoxum Games group for +$100 starting cash!',
        '👍 Thumbs up and favorite for more quality updates! 🌟',
        'Version 2.3.0\n💵 Kingpin (Evolved Tower)\n🪃 Boomerang Tower\n🏴‍☠️ Updated Pirate Crate\n🪲 Bug fixes',
        'Version 2.2.0\n☀️ Beach Crate\n🎆 Patriotic Crate\n🤿 Scuba Ops Crate',
      ],
      info: {
        visitas: '4.870 M',
        tamanoServidor: '50',
        genero: 'Estrategia',
        subgenero: 'Defensa de torres',
        creada: '4/6/2019',
        actualizada: '22/7/2026',
        chatVoz: 'Compatible',
        camara: 'No compatible',
      },
      // emblema15 es duplicado del Nivel 100 (emblema14): se omite. Los
      // datos de "Derroto al Brute" no salian completos en la referencia.
      emblemas: [
        { imagen: emblemaKp(1), nombre: 'Núcleo del Vacío Triunfante', subtitulo: 'Has triunfado sobre el ejército más fuerte. Felicidades, eres realmente fuerte...', rareza: '0.0% (Imposible)', ganadasAyer: '17', ganadasTotal: '23326' },
        { imagen: emblemaKp(2), nombre: 'Triunfo Hardcore', subtitulo: 'Has triunfado sobre los más fuertes... espera un minuto... hazlo de nuevo en Voidcore.', rareza: '0.3% (Imposible)', ganadasAyer: '1773', ganadasTotal: '175917' },
        { imagen: emblemaKp(3), nombre: 'Derrota al Bruto del Vacío', subtitulo: 'Obtén el logro "Asesino de tiranos" al derrotar al Bruto del Vacío.', rareza: '0.0% (Imposible)', ganadasAyer: '31', ganadasTotal: '28914' },
        { imagen: emblemaKp(4), nombre: 'Derrota al Guardián del Vacío', subtitulo: 'Obtén el logro "Inquisidor" derrotando al Guardián del Vacío.', rareza: '0.0% (Imposible)', ganadasAyer: '31', ganadasTotal: '29492' },
        { imagen: emblemaKp(5), nombre: 'Derrota al vindicador', subtitulo: 'Obtén el logro "Vindicador" derrotando al Vindicador.', rareza: '0.0% (Imposible)', ganadasAyer: '32', ganadasTotal: '27592' },
        { imagen: emblemaKp(6), nombre: 'Derrota al ladrón de almas.', subtitulo: 'Obtén el logro "Exorcista" derrotando al Ladrón de Almas.', rareza: '0.0% (Imposible)', ganadasAyer: '34', ganadasTotal: '26070' },
        { imagen: emblemaKp(7), nombre: 'Derrota al maestro de espadas del vacío', subtitulo: 'Obtén el logro "Maestro de Espadas" al derrotar al Maestro de Espadas del Vacío.', rareza: '0.0% (Imposible)', ganadasAyer: '33', ganadasTotal: '24944' },
        { imagen: emblemaKp(8), nombre: '¡Bienvenido a TDS!', subtitulo: '¡Has completado el tutorial! ¡Bienvenido al recluta de Tower Defense Simulator!', rareza: '3.1% (De locos)', ganadasAyer: '21549', ganadasTotal: '19545692' },
        { imagen: emblemaKp(9), nombre: 'Nivel 10', rareza: '1.0% (Imposible)', ganadasAyer: '7117', ganadasTotal: '18220633' },
        { imagen: emblemaKp(10), nombre: 'Nivel 20', subtitulo: 'Nivel 20', rareza: '0.6% (Imposible)', ganadasAyer: '4276', ganadasTotal: '11307409' },
        { imagen: emblemaKp(11), nombre: 'Nivel 30', subtitulo: 'Alcanzaste el nivel 30! Teniendo este emblema te dara el Jefe Crook en el juego.', rareza: '0.4% (Imposible)', ganadasAyer: '2879', ganadasTotal: '8079162' },
        { imagen: emblemaKp(12), nombre: 'Nivel 50', subtitulo: '¡Has alcanzado el nivel 50! Como recompensa, obtuviste la torre de torretas.', rareza: '0.3% (Imposible)', ganadasAyer: '1789', ganadasTotal: '4816298' },
        { imagen: emblemaKp(13), nombre: 'Nivel 75', subtitulo: '¡Has alcanzado el nivel 75! Como recompensa, obtuviste la torre de mortero.', rareza: '0.2% (Imposible)', ganadasAyer: '1502', ganadasTotal: '3043029' },
        { imagen: emblemaKp(14), nombre: 'Nivel 100', subtitulo: '¡Has alcanzado el nivel 100!', rareza: '0.2% (Imposible)', ganadasAyer: '1334', ganadasTotal: '2216063' },
        { imagen: emblemaKp(16), nombre: '¡Alcanza el Nivel 150!', subtitulo: '¡Después de derribar todos los modos de juego y jefes, finalmente has alcanzado el nivel 150!', rareza: '0.2% (Imposible)', ganadasAyer: '1171', ganadasTotal: '1234645' },
        { imagen: emblemaKp(17), nombre: 'Derrotó al Brute', subtitulo: 'Derrota al Brute en modo Fácil.', rareza: '2.5% (De locos)', ganadasAyer: '15840', ganadasTotal: '14203311' },
        { imagen: emblemaKp(18), nombre: 'Derrota al excavador de tumbas', subtitulo: '¡Prepárate para tener tu tumba excavada! ¡Gana esta insignia derrotando al jefe de Grave Digger en el modo "Casual"!', rareza: '1.8% (De locos)', ganadasAyer: '12633', ganadasTotal: '12695636' },
        { imagen: emblemaKp(19), nombre: '¡Patiente Cero derrotado!', subtitulo: '¡Destruye el apocalipsis desde sus raíces! ¡Has derrotado el modo intermedio!', rareza: '1.2% (De locos)', ganadasAyer: '8580', ganadasTotal: '6216420' },
        { imagen: emblemaKp(20), nombre: 'Derrota al Señor de la Guerra Derretido', subtitulo: 'Bueno, esa fue una batalla bastante acalorada.', rareza: '0.5% (Imposible)', ganadasAyer: '3475', ganadasTotal: '17312129' },
        { imagen: emblemaKp(21), nombre: 'Derrota al Rey Caído', subtitulo: 'El líder del ejército.', rareza: '0.5% (Imposible)', ganadasAyer: '3376', ganadasTotal: '2662030' },
      ],
    },
  },
  {
    id: 'tinta',
    nombre: '[🎂] Juego de tinta',
    creador: 'games i think',
    verificado: true,
    madurez: 'Leve',
    valoracion: 79,
    activos: '26.6K',
    icono: iconoTinta,
    capturas: [tinta1, tinta2, tinta3],
    detalle: {
      eventos: [
        {
          imagen: tintaEvento,
          chip: '25 de may. de 2099 a la(s) 12:00',
          nombre: 'RUTA REBELDE 1',
          subtitulo: 'NUEVO CONTENIDO',
        },
      ],
      descripcion: [
        '🆕 NUEVO: ACTUALIZACIÓN DE ANIVERSARIO + REVISIÓN DE ABUSO DE ADMINISTRADORES',
        '🐙 Sobrevive a desafíos mortales inspirados en Squid Game.',
        '🏅 Sé el último en pie o rebélate y escapa con todos tus amigos.',
        '🐥 [3 FINALES] [REBELDE, PELEA FINAL Y JUEGOS DE CALAMAR EN EL CIELO]',
        '💻 🎮 📱 Funciona en todos los dispositivos: PC, consola, móvil.',
        '⚠️ Los tramposos serán baneados permanentemente sin dudas, no hagas trampa o serás baneado. ⚠️',
        'Hecho por algunos desarrolladores de HBG.',
      ],
      info: {
        visitas: '3.200 M',
        tamanoServidor: '100',
        genero: 'Equipo y casual',
        creada: '30/12/2024',
        actualizada: '22/7/2026',
        chatVoz: 'Compatible',
        camara: 'Compatible',
      },
      // Textos de la seccion Emblema de la pagina oficial del juego.
      // emblema4 es un duplicado de la Dalgona: queda de placeholder para
      // "Escapado durante una rebelion" hasta tener el arte del helicoptero.
      emblemas: [
        { imagen: emblema(0), nombre: 'Luz Roja Sobrevivida Luz Verde', rareza: '14.5% (Difícil)', ganadasAyer: '100050', ganadasTotal: '145597087' },
        { imagen: emblema(1), nombre: 'Galleta de la Mona Lisa', subtitulo: 'Desafortunado, pero al menos te cura mucho si lo ganas', rareza: '1.8% (De locos)', ganadasAyer: '12436', ganadasTotal: '22824338' },
        { imagen: emblema(2), nombre: 'Galleta de Sack Boy', subtitulo: '¡Encuéntralo!', rareza: '1.8% (De locos)', ganadasAyer: '12383', ganadasTotal: '22984844' },
        { imagen: emblema(3), nombre: 'Dalgona Sobreviviente', rareza: '9.8% (Extremo)', ganadasAyer: '67618', ganadasTotal: '107295391' },
        { imagen: emblema(5), nombre: 'Sobrevivientes apagaron las luces', rareza: '9.4% (Extremo)', ganadasAyer: '64772', ganadasTotal: '85602883' },
        { imagen: emblema(6), nombre: 'Sobrevivió a Hide and Seek', rareza: '3.6% (De locos)', ganadasAyer: '24795', ganadasTotal: '24875737' },
        { imagen: emblema(7), nombre: 'Tug de Guerra Sobrevivido', rareza: '5.0% (De locos)', ganadasAyer: '34398', ganadasTotal: '37951816' },
        { imagen: emblema(8), nombre: 'Cuerda de salto sobrevivida', rareza: '2.2% (De locos)', ganadasAyer: '15271', ganadasTotal: '16871519' },
        { imagen: emblema(9), nombre: 'Puente de Vidrio Sobrevivido', rareza: '2.6% (De locos)', ganadasAyer: '17658', ganadasTotal: '30591760' },
        { imagen: emblema(10), nombre: 'Inició una Rebelión', subtitulo: '[Votaste por terminar los juegos... pero se negaron.]', rareza: '1.4% (De locos)', ganadasAyer: '9568', ganadasTotal: '16643580' },
        { imagen: emblema(11), nombre: 'Mingle Sobrevivido', rareza: '2.9% (De locos)', ganadasAyer: '20258', ganadasTotal: '19222067' },
        { imagen: emblema(12), nombre: 'Sobrevivir al juego de calamar [Terminando 1]', subtitulo: 'Lo soportaste todo. El premio te pertenece solo a ti', rareza: '1.2% (De locos)', ganadasAyer: '7987', ganadasTotal: '7559669' },
        { imagen: emblema(4), nombre: 'Escapado durante una rebelión [Terminando 2]', subtitulo: 'Lo lograste con los otros sobrevivientes. Todos tuvieron un corte', rareza: '0.4% (Imposible)', ganadasAyer: '2935', ganadasTotal: '6397800' },
        { imagen: emblema(13), nombre: 'Sobrevivió a The SKY Squid Games [Terminando 3]', rareza: '0.3% (Imposible)', ganadasAyer: '1918', ganadasTotal: '2671124' },
      ],
    },
  },
  {
    id: 'dinosaurio',
    nombre: 'Cazadores de dinosaurios [UPD]',
    creador: 'Fishgig Game',
    verificado: true,
    madurez: 'Leve',
    valoracion: 92,
    activos: '13,6 mil',
    icono: iconoDinosaurio,
    capturas: [dinosaurio1, dinosaurio2, dinosaurio3],
    detalle: {
      eventos: [
        {
          imagen: dinosaurioEvento1,
          chip: 'vie., jul. 24 a la(s) 8:00',
          nombre: 'RAPTOR UPDATE',
          subtitulo: 'Raptor Nest Survival',
        },
      ],
      descripcion: [
        '🦖 ¡Bienvenido a Dino Hunters!',
        '¡Toma tu arma y entra en un mundo prehistórico! Dispara, captura y entrena poderosos dinosaurios. Mejora y evoluciona tu equipo de dinosaurios, lucha en emocionantes batallas de dinosaurios, explora nuevos mundos y descubre dinosaurios raros.',
        '🔫 Dispara a los dinosaurios\n🦕 Atrapa y recoge dinosaurios para construir tu equipo más fuerte\n⬆️ Evoluciona, mejora y sube de rango\n🌍 Explora nuevos mundos y descubre nuevos dinosaurios',
        '¡Conviértete en el mejor cazador de dinosaurios!',
      ],
      info: {
        visitas: '5,4 M',
        tamanoServidor: '8',
        genero: 'Simulación',
        subgenero: 'Simulador incremental',
        creada: '4/6/2026',
        actualizada: '21/7/2026',
        chatVoz: 'Compatible',
        camara: 'Compatible',
      },
    },
  },
  {
    id: 'falsitud',
    nombre: '[FALSITUD PRONTO] 🚪 Sobrevive a la Verdad en el Área 51',
    creador: 'Mochi Productions!',
    verificado: true,
    madurez: 'Leve',
    valoracion: 74,
    activos: '9,7 mil',
    icono: iconoFalsitud,
    capturas: [falsitud1, falsitud2, falsitud3],
    detalle: {
      eventos: [
        {
          imagen: falsitudEvento1,
          chip: 'sáb., jul. 25 a la(s) 10:00',
          nombre: 'FALSITY BOSS + MORE',
          subtitulo: 'COMING SOON..',
        },
      ],
      descripcion: [
        '🚪 ¿Puedes sobrevivir a VERITY en el Área 51? 🔦',
        '🗺️ Explora el Área 51 y los TRASFONDOS\n🔫 ¡Lucha contra VERITY con tus ARMAS! 🔫\n🔎 Encuentra objetos que te ayudarán a SOBREVIVIR\n🌟 ¡Forma equipos con AMIGOS y SERES QUERIDOS! 🌟',
        '👍 ¡Dale ME GUSTA y añádelo a tus FAVORITOS si lo disfrutas! 🌟',
        '❤️ Únete a nuestro GRUPO para estar siempre actualizado',
      ],
      info: {
        visitas: '7,9 M',
        tamanoServidor: '12',
        genero: 'Supervivencia',
        creada: '5/7/2026',
        actualizada: '23/7/2026',
        chatVoz: 'Compatible',
        camara: 'Compatible',
      },
    },
  },
];

export function juegoPorId(id: string): JuegoRb | null {
  return JUEGOS_RB.find((juego) => juego.id === id) ?? null;
}
