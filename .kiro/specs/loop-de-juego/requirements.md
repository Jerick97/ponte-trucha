# Requirements Document

> El loop visual sigue vigente, pero reto, intento, score y progreso pasan a ser
> autoritativos en backend. La integración se planifica en
> `../backend-serverless/` y requiere cuenta adulta/perfil infantil.

> Loop de juego y teléfono simulado

## Introduction

Es el corazón del producto: la pantalla simula un teléfono, al niño le llegan
mensajes de sus juegos y debe decidir **¿trampa o de confianza?**. Al responder,
el juego resalta las señales que delataban la estafa y explica la lección en
lenguaje de niño. La partida acumula puntaje y rachas, y termina en un "nivel de
trucha" divertido y compartible.

Esta feature cubre la experiencia completa **sin** el estafador conversacional
(eso vive en la spec `estafador-conversacional`) y **sin** el contenido de los
escenarios (spec `banco-escenarios`).

Owner principal: Jerick (UI). Owner de las reglas de puntaje: Clau.

## Glossary

- **Escenario**: un mensaje del banco con su respuesta correcta, sus señales y su lección.
- **Veredicto**: la decisión del niño, `trampa` o `confianza`.
- **Señal delatora**: fragmento literal del mensaje que revela la estafa; se resalta en el feedback.
- **Ronda**: la lista de escenarios de una partida (8 por defecto).
- **Racha**: cantidad de aciertos consecutivos; da bonus de puntaje.
- **Nivel de trucha**: resultado final del jugador (Novato, Ojo despierto, Trucha, Súper trucha).
- **Fase**: estado de la pantalla (`inicio`, `mensaje`, `feedback`, `chat`, `resultado`).

## Requirements

### Requisito 1: Teléfono simulado

**Historia de Usuario:** Como niño, quiero que la pantalla se vea como el chat de mi juego, para que la práctica se sienta real y no como una tarea del colegio.

#### Criterios de Aceptación

1. CUANDO la app carga en un móvil ENTONCES el sistema DEBERÁ renderizar un marco de teléfono de máximo 420 px de ancho, centrado y sin scroll horizontal
2. CUANDO se muestra un escenario ENTONCES el sistema DEBERÁ mostrar en la barra superior el nombre, el avatar y si la cuenta aparece como "verificada"
3. CUANDO el escenario tiene canal `whatsapp`, `sms`, `discord` o `chat-juego` ENTONCES el sistema DEBERÁ aplicar el tratamiento visual correspondiente a ese canal
4. CUANDO el mensaje se renderiza ENTONCES el sistema DEBERÁ mostrarlo en una burbuja entrante sin cortar el texto ni requerir scroll dentro de la burbuja

### Requisito 2: Decisión trampa o confianza

**Historia de Usuario:** Como niño, quiero decidir rápido con dos botones grandes, para poder jugar en segundos con una sola mano.

#### Criterios de Aceptación

1. CUANDO la fase es `mensaje` ENTONCES el sistema DEBERÁ mostrar exactamente dos botones: "Es trampa" y "De confianza"
2. CUANDO se renderizan los botones ENTONCES cada uno DEBERÁ tener al menos 44 px de alto de área táctil
3. CUANDO el niño elige una opción ENTONCES el sistema DEBERÁ registrar el veredicto y pasar a la fase `feedback` sin recargar la página
4. CUANDO la fase es `feedback` ENTONCES el sistema NO DEBERÁ permitir cambiar la respuesta

### Requisito 3: Feedback educativo

**Historia de Usuario:** Como niño, quiero entender por qué me equivoqué (o por qué acerté), para reconocer la misma trampa la próxima vez.

#### Criterios de Aceptación

1. CUANDO se entra a la fase `feedback` ENTONCES el sistema DEBERÁ resaltar dentro del mensaje cada `fragmento` de las señales del escenario
2. CUANDO se resalta una señal ENTONCES el sistema DEBERÁ mostrar su explicación en lenguaje de niño
3. CUANDO el niño acierta ENTONCES el sistema DEBERÁ mostrar refuerzo positivo corto y los puntos ganados
4. CUANDO el niño falla ENTONCES el sistema DEBERÁ explicar sin regañar, siguiendo `.kiro/steering/tono-infantil.md`
5. CUANDO el escenario es de tipo `legitimo` ENTONCES el sistema DEBERÁ explicar por qué el mensaje era seguro, no solo decir "correcto"
6. CUANDO la explicación termina ENTONCES el sistema DEBERÁ mostrar la lección del escenario en una sola frase

### Requisito 4: Puntaje y rachas

**Historia de Usuario:** Como niño, quiero ver que mi puntaje sube cuando encadeno aciertos, para querer seguir jugando.

#### Criterios de Aceptación

1. CUANDO el niño acierta ENTONCES el sistema DEBERÁ sumar 100 puntos más 25 por cada acierto consecutivo previo
2. CUANDO el bonus de racha supera 100 puntos ENTONCES el sistema DEBERÁ topearlo en 100
3. CUANDO el niño falla ENTONCES el sistema DEBERÁ reiniciar la racha a 0 sin restar puntaje
4. CUANDO la racha se reinicia ENTONCES el sistema DEBERÁ conservar la mejor racha de la partida
5. CUANDO la fase es `mensaje` o `feedback` ENTONCES el sistema DEBERÁ mostrar ronda actual, puntaje y racha en el HUD

### Requisito 5: Armado de la ronda

**Historia de Usuario:** Como niño, quiero que cada partida sea distinta, para que no me aburra jugar otra vez.

#### Criterios de Aceptación

1. CUANDO se inicia una partida ENTONCES el sistema DEBERÁ seleccionar 8 escenarios del banco sin repetir
2. CUANDO se arma la ronda ENTONCES el sistema DEBERÁ incluir al menos un mensaje legítimo, con una cuota objetivo de un tercio
3. CUANDO la ronda queda armada ENTONCES el sistema DEBERÁ ordenarla de menor a mayor dificultad
4. CUANDO se llama a la función de armado con una fuente de aleatoriedad fija ENTONCES el resultado DEBERÁ ser determinista, para poder testearlo

### Requisito 6: Nivel de trucha y pantalla final

**Historia de Usuario:** Como niño, quiero un resultado divertido que pueda mandarle a mis amigos, para retarlos a superarlo.

#### Criterios de Aceptación

1. CUANDO se responde el último escenario ENTONCES el sistema DEBERÁ pasar a la fase `resultado`
2. CUANDO se calcula el resultado ENTONCES el sistema DEBERÁ asignar: Súper trucha ≥ 90 %, Trucha ≥ 70 %, Ojo despierto ≥ 45 %, Novato por debajo
3. CUANDO se muestra el resultado ENTONCES el sistema DEBERÁ mostrar puntaje, porcentaje de aciertos y mejor racha
4. CUANDO el niño toca "Compartir" ENTONCES el sistema DEBERÁ usar la Web Share API y, si no existe, copiar el texto al portapapeles
5. CUANDO el niño toca "Jugar otra vez" ENTONCES el sistema DEBERÁ volver a `inicio` con el estado limpio

### Requisito 7: Accesibilidad y rendimiento

**Historia de Usuario:** Como niño con un celular modesto y datos limitados, quiero que el juego cargue rápido y se pueda usar, para no quedarme fuera.

#### Criterios de Aceptación

1. CUANDO la app se compila ENTONCES el bundle inicial DEBERÁ pesar menos de 200 KB comprimido
2. CUANDO el usuario tiene `prefers-reduced-motion` activo ENTONCES el sistema DEBERÁ desactivar animaciones no esenciales
3. CUANDO cambia la fase ENTONCES el sistema DEBERÁ anunciar el feedback con `aria-live="polite"`
4. CUANDO se navega solo con teclado ENTONCES el sistema DEBERÁ permitir completar una partida entera
5. CUANDO se mide el contraste de texto ENTONCES DEBERÁ cumplir WCAG 2.2 AA (4.5:1 en texto normal)
