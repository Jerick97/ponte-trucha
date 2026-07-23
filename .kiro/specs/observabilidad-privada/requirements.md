# Requisitos — Observabilidad privada

**Owner:** Francis  
**Estado:** aprobado para planificación; implementación pendiente

## Requisitos EARS

### R1 — Operación nativa

- EL SISTEMA DEBE emitir logs JSON, métricas y traces mediante
  CloudWatch/Powertools.
- EL SISTEMA NO DEBE registrar eventos Lambda completos, cuerpos, tokens, PII,
  chat, prompts ni respuestas.
- CUANDO una ruta falla, EL SISTEMA DEBE producir un correlation ID y código de
  error sin exponer detalles internos.

### R2 — Alarmas y costo

- EL SISTEMA DEBE alarmar por 5xx, throttles, latencia, dependencias y presupuesto.
- LAS MÉTRICAS DEBEN usar dimensiones de baja cardinalidad.
- CUANDO una alarma se dispara, EL EQUIPO DEBE tener un runbook accionable.

### R3 — Sentry

- CUANDO Sentry está habilitado, EL SDK DEBE usar `send_default_pii=false` y
  sanitización antes del envío.
- EL SISTEMA NO DEBE habilitar replay, user feedback, profiling ni LLM
  monitoring.
- SI Sentry falla, EL REQUEST DEBE continuar o fallar solo por su causa original.
- ANTES de producción, UNA PRUEBA DEBE confirmar que payloads señuelo no llegan.

### R4 — Mixpanel

- MIXPANEL DEBE estar apagado por defecto.
- CUANDO no existe consentimiento `productAnalytics`, EL SISTEMA NO DEBE enviar
  eventos.
- CUANDO se envía un evento, DEBE pertenecer al catálogo y usar solo propiedades
  permitidas.
- EL SISTEMA DEBE desactivar geolocalización y no enviar IP ni IDs de Cognito.
- CUANDO se revoca consentimiento, EL SISTEMA DEBE detener envío y solicitar
  borrado del ID analítico.

### R5 — Resiliencia

- SI Mixpanel o Sentry no responden, EL SISTEMA NO DEBE bloquear emisión,
  calificación ni progreso.
- EL SISTEMA DEBE aplicar timeouts cortos, sin reintentos ilimitados.
- LOS FALLOS DE TELEMETRÍA DEBEN producir métricas propias sin recursión.

### R6 — Tests y documentación

- CADA evento y propiedad DEBE tener un test de allowlist.
- LOS SCRUBBERS DEBEN tener tests con email, token, IP y texto libre.
- EL SISTEMA DEBE documentar retención, residencia, borrado y responsables.
- TODO nuevo evento DEBE actualizar spec, catálogo y tests antes de código.

## Aceptación

- Un usuario sin consentimiento no produce tráfico a Mixpanel.
- Un error con datos señuelo llega sanitizado a Sentry o se descarta.
- El loop sigue funcionando si ambos proveedores están caídos.
- Dashboard y alarmas distinguen salud operativa, seguridad y costo.

