/**
 * Valida src/data/escenarios.json contra el esquema y contra las reglas
 * de contenido que no caben en un JSON Schema.
 *
 * Se ejecuta con `npm run validar:escenarios` y automaticamente desde el
 * hook de Kiro .kiro/hooks/validar-escenarios.kiro.hook cada vez que
 * alguien edita el banco. Sin dependencias: node puro.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rutaBanco = resolve(raiz, 'src/data/escenarios.json');
const rutaEsquema = resolve(raiz, 'src/data/escenarios.schema.json');

const banco = JSON.parse(readFileSync(rutaBanco, 'utf8'));
const esquema = JSON.parse(readFileSync(rutaEsquema, 'utf8'));

const errores = [];
const avisos = [];

const definicion = esquema.definitions.escenario;
const requeridos = definicion.required;
const propiedades = definicion.properties;

function validarEnum(campo, valor, permitidos, id) {
  if (!permitidos.includes(valor)) {
    errores.push(`[${id}] ${campo} "${valor}" no esta en la lista permitida: ${permitidos.join(', ')}`);
  }
}

const ids = new Set();

for (const escenario of banco.escenarios) {
  const id = escenario.id ?? '(sin id)';

  for (const campo of requeridos) {
    if (escenario[campo] === undefined) errores.push(`[${id}] falta el campo obligatorio "${campo}"`);
  }

  for (const campo of Object.keys(escenario)) {
    if (!propiedades[campo]) errores.push(`[${id}] campo desconocido "${campo}"`);
  }

  if (ids.has(id)) errores.push(`[${id}] id duplicado`);
  ids.add(id);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errores.push(`[${id}] el id debe ser kebab-case en minusculas`);
  }

  validarEnum('tipo', escenario.tipo, propiedades.tipo.enum, id);
  validarEnum('canal', escenario.canal, propiedades.canal.enum, id);

  if (![1, 2, 3].includes(escenario.dificultad)) {
    errores.push(`[${id}] dificultad debe ser 1, 2 o 3`);
  }

  // --- Reglas de contenido (no las cubre el JSON Schema) ---

  // 1. Coherencia entre tipo y respuesta correcta.
  const esperada = escenario.tipo === 'legitimo' ? 'confianza' : 'trampa';
  if (escenario.respuestaCorrecta !== esperada) {
    errores.push(
      `[${id}] tipo "${escenario.tipo}" exige respuestaCorrecta "${esperada}", pero dice "${escenario.respuestaCorrecta}"`,
    );
  }

  // 2. Longitud del mensaje: tiene que caber en una burbuja de chat.
  if (typeof escenario.mensaje === 'string' && escenario.mensaje.length > 240) {
    errores.push(`[${id}] el mensaje supera los 240 caracteres (${escenario.mensaje.length})`);
  }

  // 3. Cada senal debe existir literalmente en el mensaje para poder resaltarla.
  for (const senal of escenario.senales ?? []) {
    if (!escenario.mensaje?.includes(senal.fragmento)) {
      errores.push(`[${id}] el fragmento "${senal.fragmento}" no aparece literal en el mensaje`);
    }
  }

  // 4. Si permite conversacion, necesita perfil del estafador.
  if (escenario.permiteConversacion && !escenario.perfilEstafador) {
    errores.push(`[${id}] permiteConversacion es true pero falta perfilEstafador`);
  }
  if (escenario.tipo === 'legitimo' && escenario.permiteConversacion) {
    errores.push(`[${id}] un escenario legitimo no puede permitir conversacion con estafador`);
  }

  // 5. El canal correo debe traer asunto; ningun otro canal lo usa.
  if (escenario.canal === 'correo' && !escenario.asunto) {
    errores.push(`[${id}] un escenario de canal "correo" debe incluir "asunto"`);
  }
  if (escenario.canal !== 'correo' && escenario.asunto !== undefined) {
    errores.push(`[${id}] "asunto" solo aplica al canal "correo"`);
  }

  // 6. Leccion en lenguaje de nino: frase corta.
  if (typeof escenario.leccion === 'string' && escenario.leccion.split(' ').length > 18) {
    avisos.push(`[${id}] la leccion tiene mas de 18 palabras, revisar que siga sonando a nino`);
  }
}

// --- Reglas del banco completo ---

const legitimos = banco.escenarios.filter((e) => e.tipo === 'legitimo').length;
const total = banco.escenarios.length;
const proporcion = total > 0 ? legitimos / total : 0;

if (proporcion < 0.25) {
  avisos.push(
    `Solo ${legitimos}/${total} escenarios son legitimos (${Math.round(proporcion * 100)}%). El brief pide cerca de un tercio para que los ninos aprendan a distinguir, no a desconfiar de todo.`,
  );
}

// --- Salida ---

for (const aviso of avisos) console.warn(`AVISO  ${aviso}`);

if (errores.length > 0) {
  for (const error of errores) console.error(`ERROR  ${error}`);
  console.error(`\n${errores.length} error(es) en el banco de escenarios.`);
  process.exit(1);
}

console.log(`OK  ${total} escenarios validos (${legitimos} legitimos, ${total - legitimos} estafas).`);
