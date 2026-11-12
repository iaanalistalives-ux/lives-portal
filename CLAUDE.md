# CLAUDE.md — Portal LIVES antiguo (lives-portal)

Las reglas generales de trabajo están en el repo privado `lives-instrucciones` (CLAUDE.md). Este archivo solo describe este repo.

## Estado
**El portal antiguo está cerrado para todos, sin excepciones, y no se vuelve a abrir por ninguna razón.** Todas las herramientas se usan desde el portal de Sistemas (app.lives.com.pe).

## Qué contiene
- `index.html` — el portal antiguo. Hoy solo muestra un aviso a pantalla completa, "El portal LIVES se mudó", con un único botón "Ir al portal nuevo". No se puede cerrar (Escape y Tab bloqueados) y se vuelve a poner si alguien lo quita. La base rechaza cualquier entrada con clave.
  - Casi todo el archivo es **código muerto**: el formulario de entrada con usuario y clave (la base lo rechaza), el menú completo de herramientas por área (unas 99 tarjetas), los KPIs de Inicio, la sesión y las llamadas antiguas a Apps Script y a Google Sheets. `entrarAlPortal()` sale siempre al inicio, así que nunca se pintan las tarjetas.
  - Las tarjetas apuntan a las herramientas en GitHub Pages; incluye la tarjeta "Administrar usuarios", que abre `admin.html`.
- `admin.html` — **"Quién registra"**: panel que decide en qué herramientas puede registrar (cargar datos) cada persona. Una sola vista: filtro por herramienta, búsqueda por persona, usuario o área, y "Todos" o "Solo quienes registran". Cada persona se expande con un interruptor por herramienta; si lo tiene fijo por su área, el interruptor sale deshabilitado. En modo supervisión se ve quién registra pero no se puede cambiar.
  - **No** crea ni edita usuarios, no los desactiva y no resetea claves. El único cambio posible es activar o desactivar "registra" por persona y herramienta. No exporta a Excel.
  - Encogimiento (desde el 11/11/2026): cuatro opciones, «Encogimiento · sistema completo / Modelista / Corte / Costura» (`registra_herramientas.modo = 'encog'`, `valor` = rol). Se guardan en `encog_accesos`, un solo rol por persona: al encender una se apaga la anterior; al apagar queda `activo = false`. `admin_registra_cambiar` devuelve `si` (lista completa de la persona) y la pantalla la usa para repintar.
  - Desde el 12/11/2026 (Rg02) el panel tiene 41 opciones y muestra a todas las personas de la lista de Sistemas (Excel «Usuarios Web»), con su área. Opciones nuevas: Auditoría Final, Auditoría de Corte, de Artes y de Tintorería, Avances de Packing (cargar y borrar), Registro de Auditorías, Seguimiento de Partidas · actualizar, Programa PCP · Situación de OP, WIP Muestras · Moldes e Ingeniería. Las rotuladas «(aún no bloquea)» solo muestran quién tiene el permiso: esa herramienta todavía deja guardar a cualquiera con sesión o está con registro libre. Modos nuevos de `registra_herramientas`: `sop` (`sop_registran`), `encborra` (`encajado_quien_borra`), `acor`, `art` y `atin` (filas `REGISTRA` del catálogo de cada auditoría; al apagar quedan con `activo = false`).
  - Sin opción en el panel porque no tienen permiso ni lista por persona: Final en proceso, Botones de costura, Control de Cajas, Perfil de Clientes, Time & Action y Check List de Orden y Limpieza.
  - Un perfil creado a mano sin cuenta recibe su cuenta al primer ingreso desde app.lives.com.pe (`puente_alta_auto` devuelve su usuario y `sesion-sistemas` la crea).
  - Es la parte de este repo que sigue en uso.
- `manifest.json` y `sw.js` — el portal era una app instalable (PWA). El service worker (`lives-portal-v3`) pide primero la red para el HTML y usa la copia guardada solo sin internet; los archivos estáticos salen de la copia y se refrescan en segundo plano. Para forzar una actualización hay que subir el número de `VERSION`.

## Base de datos (Supabase lives-datos)
- `admin.html`: `admin_registra_leer` (lista de personas, herramientas y quién puede cambiar) y `admin_registra_cambiar` (activar o desactivar). Solo el superusuario cambia; las tablas por detrás son `perfiles`, `permisos`, `registra_herramientas` y las listas de editores de cada herramienta.
- Los bloques comunes de sesión llaman a `version_sesion`, `mi_nombre` y `registrar_apertura`.
- La zona de usuarios (perfiles y permisos) no se borra: la usan la sesión con el portal nuevo y los permisos de guardar, hasta que Sistemas ponga su propia seguridad.

## Quién la usa
Solo la administración de Datos e IA, en `admin.html`.

## Quién puede cambiar
Solo el superusuario; lo valida la base. La pantalla está en GitHub Pages y se abre con el enlace.

## Pendientes vistos al escribir esto (21/10/2026)
- La tarjeta "Administrar usuarios" lleva a `admin.html`, que en realidad es "Quién registra"; el menú ya no se llega a mostrar, así que hoy se entra por el enlace directo o desde el portal nuevo.
- `index.html` es muy grande y casi todo es código muerto. Conviene dejar solo el aviso de mudanza y quitar el resto (login, menú, llamadas antiguas), por dos razones: nadie debería heredar ese código y hay datos que no deben estar a la vista en un repo público (detalle en la nota privada de `lives-instrucciones`).
- Si se quita el service worker, hay que dar de baja el registro en los equipos que ya tienen la app instalada.
