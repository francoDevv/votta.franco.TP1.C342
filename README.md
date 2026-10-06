# Cine Fran

Aplicación web completa para un cine de un solo edificio con varias salas: cartelera, reseñas, compra de entradas con selección de butacas, candy bar, QR de ingreso, puntos y cupones, gestión interna y reportes. Es una PWA instalable.

TP1 de **Programación IV** (UTN, T.U.P.) · Franco Votta · Comisión C342.

- **App desplegada:** https://tp1-cine.web.app
- **Repositorio:** https://github.com/francoDevv/votta.franco.TP1.C342

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, signals, `@if/@for/@switch`, formularios reactivos, rutas lazy) |
| Backend | Supabase: Postgres, Auth, RLS, funciones RPC, Realtime y Storage |
| PWA | `@angular/service-worker` + `manifest.webmanifest` |
| Hosting | Firebase Hosting |
| Librerías | `jspdf` + `jspdf-autotable` (PDF), `qrcode` (generar QR), `html5-qrcode` (leer QR con la cámara), `exceljs` (exportación a Excel) |

`jspdf` y `exceljs` se cargan con `import()` dinámico, para que no pesen en el bundle inicial.

## Cómo correrlo

```bash
npm install
# configurar src/environments/environment.development.ts con la URL y la anon key de Supabase
npm start                 # http://localhost:4200
npm run build             # build de producción (dist/tp1/browser)
npm test                  # tests unitarios (vitest)
firebase deploy           # publicar en Firebase Hosting
```

Requiere Node 22.22.3 o superior (o Node 24). El service worker solo se registra en el build de producción, no en `ng serve`.

## Roles y qué puede hacer cada uno

| Rol | Alcance |
|---|---|
| Visitante (anónimo) | Ver cartelera, próximos estrenos, reseñas y promedios; comprar con un mail de contacto |
| Cliente | Todo lo anterior, más: perfil, Mis entradas, Mis películas, reseñas, puntos y canjes, crédito por cancelaciones, cupón de bienvenida, avisos de estreno |
| Empleado | Valida QR en puerta y en candy bar (`/empleado`) |
| Gestor | Películas, salas y butacas, funciones, candy (productos, categorías, combos), cupones y reportes |
| Admin | Todo lo del gestor, más precios, recompensas y log de actividad |

El acceso se controla en tres niveles: guards de ruta en Angular (`authGuard`, `rolGuard`, `conexionGuard`), políticas RLS en las tablas y chequeo del rol dentro de las funciones RPC. Los guards de Angular solo mejoran la experiencia; **la seguridad real está en la base**.

## Arquitectura

```
src/app/
├── pages/        pantallas públicas y del cliente (una carpeta por pantalla)
├── gestor/       módulo de gestión, cargado de forma lazy (gestor.routes.ts)
├── services/     acceso a datos y lógica de cliente; un servicio por dominio
├── guards/       authGuard, rolGuard, conexionGuard
└── shared/       componentes reutilizables y utilidades
                  (selector-fecha, selector-hora, selector-imagen,
                   grafico-barras, barra-pwa, avisos-estreno, fechas.ts)
```

Decisiones de estructura:

- **Servicios por dominio.** `peliculas`, `funciones`, `salas`, `butacas`, `candy`, `compras`, `entradas`, `cupones`, `puntos`, `validacion`, `reportes`, `actividad`, `alertas`, `exportacion`, `auth`, `configuracion` y `pwa`. Los componentes no hablan directo con Supabase (salvo casos puntuales de lectura): llaman a un servicio.
- **Estado con signals.** Cada pantalla guarda su estado en `signal`/`computed`; los totales de la compra, la selección de butacas y los filtros son `computed`, así que no hay que sincronizarlos a mano.
- **Carga lazy** de todas las rutas y de todo el módulo de gestión, para que el cliente descargue solo lo que usa.
- **Componentes de formulario propios** (`ControlValueAccessor`): selector de fecha, de hora y de imagen, usados en los formularios de gestión y en el registro.
- **Un solo cliente de Supabase** (`SupabaseService`), inyectado en los servicios.

### Modelo de datos (resumen)

`peliculas` y `generos` (relación `pelicula_genero`), `salas` y `butacas` (tipos: estándar, VIP, accesible), `funciones`, `compras` y `entradas`, `productos`, `categorias_candy`, `combos` y `combo_items`, `compra_productos`, `cupones`, `recompensas`, `resenas`, `alertas_estreno`, `clientes` y `personal`, `configuracion_precios`, `log_actividad`. Hay vistas para datos que pueden ser públicos (`clientes_publicos`, `promedio_resenas`, `credito_disponible`).

### Lógica de negocio en la base

Las reglas que no se pueden dejar en manos del navegador viven en funciones Postgres (`SECURITY DEFINER`, con `search_path` vacío) y se llaman por RPC:

| Función | Qué garantiza |
|---|---|
| `reservar_butacas` / `liberar_*` | Reserva temporal de butacas sin carreras entre dos compradores |
| `confirmar_compra` | Precio calculado en el servidor (base o preventa + recargo VIP), cupones, canje de puntos, crédito, restricción de edad, creación de entradas y puntos ganados, todo en una transacción |
| `cancelar_compra` | Cancelación hasta 2 horas antes, con devolución como crédito |
| `validar_qr` / `consultar_qr` | QR de un solo uso por compra, dentro de la ventana válida |
| `precios_funcion`, `actualizar_precios` | Precio vigente de cada tipo de butaca |
| `peliculas_mas_vendidas`, `peliculas_mas_vistas`, `productos_mas_vendidos`, `reporte_facturacion` | Reportes y top de la cartelera |
| `consultar_log`, `usuarios_del_log` | Auditoría para el admin |

Triggers sobre funciones, precios y datos del candy escriben en `log_actividad` quién hizo qué y cuándo.

### Tiempo real

La selección de butacas se suscribe por Realtime a los cambios de la función: si otra persona toma una butaca, el mapa se actualiza al instante.

### Zona horaria

Todo se guarda en UTC y se muestra en horario de Argentina (`America/Argentina/Buenos_Aires`): `DATE_PIPE_DEFAULT_OPTIONS`, `LOCALE_ID es-AR`, el PDF y la función `hoy_ar()` en la base, para que "hoy" y "7 días antes del estreno" no se corran de día por el huso horario.

## Decisiones técnicas y de negocio

Decisiones tomadas ante puntos que los mails del cliente dejaban abiertos o permitían interpretar de más de una forma:

1. **Un QR por compra, de un solo uso.** Valida entradas y candy a la vez. Es válido desde 1 hora antes del inicio hasta el fin de la función. Una vez usado, deja de funcionar.
2. **Una compra, varias entradas.** Cada butaca es una entrada, pero se compran, se pagan, se cancelan y se ven agrupadas en una sola compra.
3. **Cancelación.** Hasta 2 horas antes de la función, con crédito (lo pagado más el crédito usado en esa compra). El botón desaparece pasado ese plazo.
4. **Precio.** `precio_butaca = base (o preventa) + recargo VIP`. La preventa rige desde 7 días antes del estreno.
5. **Puntos.** 1 punto por peso pagado, solo para clientes registrados. Los canjes se aplican dentro de la misma compra; una entrada gratis se aplica a la butaca más barata. El costo de cada recompensa sale de su precio dividido por el retorno del 10 %.
6. **Restricción de edad.** Los clientes registrados se validan con su fecha de nacimiento. Quien compra como anónimo una película +13/+18 debe tildar un aviso explícito, y el servidor lo exige (`p_acepta_restriccion`).
7. **Top 3 de la cartelera.** Entradas vendidas y no canceladas de los últimos 30 días.
8. **Mis películas.** Solo cuentan entradas efectivamente validadas, es decir, películas que se vieron.
9. **Facturación.** Se mide lo cobrado: incluye compras canceladas y funciones pasadas a crédito.
10. **PDF solo mientras es usable.** Se puede descargar mientras la función no terminó y la entrada sigue activa.
11. **Validaciones también en el servidor.** Lo que valida el formulario se vuelve a validar en la base; el frontend es comodidad, no seguridad.
12. **Pago simulado.** No hay pasarela de pago real; el botón "Pagar (simulado)" confirma la compra.

## PWA

- `manifest.webmanifest` con íconos (incluido maskable), colores y `display: standalone`: la app se puede instalar en Chrome, Edge, Android y iOS (en iOS desde "Agregar a pantalla de inicio"; la app muestra las instrucciones).
- Service worker (`ngsw-config.json`):
  - **assetGroups:** el código de la app y los archivos estáticos se precargan.
  - **dataGroups `catalogo`** (estrategia *freshness*, timeout de 4 s): películas, géneros, funciones, productos, combos, reseñas y promedios. Con red se muestra siempre lo más nuevo; sin red, lo último visto.
  - **dataGroups `imagenes`** (estrategia *performance*): imágenes de Supabase Storage.
- **Modo sin conexión.** La cartelera, el detalle de película, las funciones y el candy ya vistos se pueden consultar sin red. Las pantallas que necesitan datos en vivo o escriben (butacas, candy para comprar, perfil, Mis entradas) están protegidas por `conexionGuard`: si no hay red, llevan a `/sin-conexion`, y al volver la conexión te devuelven a donde estabas. Si la carga falla, la pantalla muestra un mensaje con **Reintentar** en lugar de quedarse cargando.
- **Aviso de nueva versión.** `PwaService` detecta `VERSION_READY` y la barra inferior ofrece actualizar.
- **Barra de instalación** (`barra-pwa`), con un recordatorio que se puede descartar por 14 días.
- Los encabezados de caché de Firebase (`firebase.json`) evitan que `ngsw-worker.js` y `ngsw.json` queden cacheados, para que las actualizaciones lleguen.

**Límite acordado con el cliente:** el QR sin conexión y las notificaciones push quedan fuera del alcance; con un aviso en pantalla alcanza.

**Detalle técnico importante:** las URL de las consultas REST a Supabase tienen que ser idénticas entre llamadas para que el service worker las encuentre en caché. Por eso los filtros por fecha usan solo el día y no `new Date().toISOString()`, y el filtro fino se hace en el cliente.

## Diseño

Estilo propio con tema oscuro y estética de ticket de cine (tarjetas con perforación, etiquetas tipo "destacado"), tipografías propias y diseño responsive pensado primero para celular. El navbar agrupa las opciones de gestión en menús desplegables y respeta el área segura (*safe area*) en celulares con notch.

## Usuarios de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Cliente | _completar_ | _completar_ |
| Empleado | _completar_ | _completar_ |
| Gestor | _completar_ | _completar_ |
| Admin | _completar_ | _completar_ |

## Lo que queda fuera del alcance

- Pasarela de pago real (el pago es simulado).
- QR sin conexión y notificaciones push (acordado).
- La compra y la selección de butacas requieren conexión, porque dependen de disponibilidad en tiempo real.
