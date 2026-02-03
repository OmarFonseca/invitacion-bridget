# Invitación web (GitHub Pages) — Fiesta de 3 años 🐠

Invitación interactiva con temática marina para confirmar asistencia (RSVP) **sin backend**, lista para desplegar en **GitHub Pages**.

## Archivos

- `index.html`: contenido y estructura de la invitación + formulario + boleto.
- `styles.css`: diseño pastel + animaciones (agua, burbujas, peces) + estilos de impresión.
- `script.js`: lógica de RSVP, persistencia en `localStorage`, descarga de `invitados.json`, y export de boleto.

## Cómo funciona el registro SIN backend

- **Persistencia local**: las confirmaciones se guardan en `localStorage` del navegador (en este dispositivo).
  - Clave: `bridget_rsvp_records_v1`
  - Con eso se calculan y muestran totales: **adultos**, **niños** y **total**.

### Limitación clave (GitHub Pages)
En un sitio 100% estático (GitHub Pages) **no se puede escribir** un archivo “central” como `registrados.json` en el repositorio/servidor desde el navegador.  
Cada invitado guarda sus datos **solo en su propio dispositivo**.

### Limitaciones conocidas

- **No hay sincronización** entre dispositivos/navegadores: si un invitado confirma en su celular, esa confirmación **no aparece** en tu laptop, porque no hay backend.
- La descarga automática del archivo depende del navegador: algunos navegadores pueden pedir permiso o bloquear descargas múltiples.
- La opción “Guardar como PDF” usa `window.print()` y el diálogo del navegador (es lo más simple sin librerías).

## Cómo desplegar en GitHub Pages

1. Crea un repositorio en GitHub (ej. `invitacion-bridget`).
2. Sube estos archivos a la **raíz** del repo:
   - `index.html`, `styles.css`, `script.js`, `README.md`
3. En GitHub:
   - **Settings → Pages**
   - **Build and deployment → Source: Deploy from a branch**
   - Selecciona **Branch: `main`** y **Folder: `/ (root)`**
4. Guarda y espera a que GitHub genere tu URL de Pages.

## Uso rápido

- Abre la invitación.
- Ve a “Confirmar asistencia”.
- Captura:
  - Nombre del invitado/familia
  - Número de adultos
  - Número de niños
- Al confirmar:
  - Se guarda en `localStorage`
  - Se actualizan los contadores
  - Se muestra el **boleto digital**
  - Puedes descargar el **boleto en PNG**
  - No se descarga ningún archivo de registros al invitado

## Testing (sin instalar nada)

Abre `tests.html` en un servidor local y presiona **“Correr tests”**.

- Valida reglas de `validateForm`
- Prueba guardado/carga en `localStorage`
- Prueba cálculo de totales

## Extensiones fáciles

- Agregar campo de teléfono/WhatsApp
- Agregar selector “Asistiré / No asistiré”
- Agregar export a `.txt` además de `.json`
- Agregar una vista “Admin” para copiar/pegar registros

