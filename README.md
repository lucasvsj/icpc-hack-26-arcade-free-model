# 🎮 Hackathon ICPC: Desafío Arcade

En Buk, sponsor oficial de la [Hackathon ICPC](https://icpc.global/regionals/finder/TCP) (21 a 23 de noviembre), tenemos una máquina de arcade. Podríamos poner algún juego retro, pero mucho mejor si lo podemos convertir en un desafío.

**Tu misión:** ¡Construye el mejor juego de arcade usando Phaser 3 (librería JS para juegos) que correrá en nuestra máquina arcade física!

---

## 🏆 Premios

TBA

---

## 📋 Restricciones

Tu juego debe cumplir con estas restricciones técnicas:

### Límite de Tamaño
- ✅ **Máximo 50KB después de minificación** (antes de gzip)
- El código del juego se minifica automáticamente - enfócate en escribir buen código

### Restricciones de Código
- ✅ **Solo JavaScript vanilla puro** - Sin `import` o `require`
- ✅ **Sin URLs externas** - Sin `http://`, `https://`, o `//` (excepto URIs `data:` para base64)
- ✅ **Sin llamadas de red** - Sin `fetch`, `XMLHttpRequest`, o APIs similares
- ✅ **Ambiente sandboxed** - El juego corre en un iframe sin acceso a internet

### Lo Que SÍ Puedes Usar
- ✅ **Phaser 3** (v3.87.0) - Cargado externamente vía CDN (no cuenta en el límite de tamaño)
- ✅ **Imágenes codificadas en base64** - Usando URIs `data:`
- ✅ **Gráficos generados proceduralmente** - Usando la API de Graphics de Phaser
- ✅ **Tonos de audio generados** - Usando la Web Audio API de Phaser
- ✅ **Renderizado y efectos basados en Canvas**

# 🕹️ Controles

¡Tu juego correrá en un gabinete arcade real con joysticks y botones físicos!

## Mapeo de Botones del Arcade

El gabinete arcade envía códigos de teclas específicos cuando se presionan los botones:

**Jugador 1:**
- **Joystick**: `P1U`, `P1D`, `P1L`, `P1R` (Arriba, Abajo, Izquierda, Derecha)
- **Diagonales del Joystick**: `P1DL`, `P1DR` (Abajo-Izquierda, Abajo-Derecha)
- **Botones de Acción**: `P1A`, `P1B`, `P1C` (fila superior) / `P1X`, `P1Y`, `P1Z` (fila inferior)
- **Start**: `START1`

**Jugador 2:**
- **Joystick**: `P2U`, `P2D`, `P2L`, `P2R`
- **Diagonales del Joystick**: `P2DL`, `P2DR`
- **Botones de Acción**: `P2A`, `P2B`, `P2C` / `P2X`, `P2Y`, `P2Z`
- **Start**: `START2`

## Pruebas Locales

Para pruebas locales, puedes mapear estos botones arcade a teclas del teclado. El mapeo soporta **múltiples teclas por botón arcade** (útil para alternativas como WASD + Flechas). Ve `game.js` para el template completo de mapeo `ARCADE_CONTROLS`.

Por defecto:
- Jugador 1 usa **WASD** (joystick) y **U/I/O/J/K/L** (botones de acción)
- Jugador 2 usa **Flechas** (joystick) y **R/T/Y/F/G/H** (botones de acción)

💡 **Tip**: Mantén los controles simples - diseña para joystick + 1-2 botones de acción para la mejor experiencia arcade!

---

## ⏰ Deadline y Envío

**Deadline:** Domingo 10 de noviembre de 2025 a las 23:59 (hora Chile)

### Cómo Enviar

Enviar tu proyecto es fácil:

1. **Guarda tus cambios** - Asegúrate de que `game.js`, `metadata.json` y `cover.png` estén listos
   - **Importante:** Tu juego debe incluir un archivo `cover.png` personalizado (800x600 píxeles) que muestre tu juego
2. **Git push** - Sube tu código a tu repositorio:
   ```bash
   git add .
   git commit -m "Envío final"
   git push
   ```
3. **Click en Submit** - Haz click en el botón de envío en la UI de desarrollo y sigue los pasos

¡Eso es todo! 🎉

**Más información del desafío:** [https://arcade.lucasvsj.com/](https://arcade.lucasvsj.com/)

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
pnpm install
```

### 2. Iniciar Servidor de Desarrollo
```bash
pnpm dev
```
Esto inicia un servidor en `http://localhost:3000` con verificación de restricciones en vivo.

### 3. Construye Tu Juego
- **Edita `game.js`** - Escribe el código de tu juego arcade
- **Actualiza `metadata.json`** - Define el nombre y descripción de tu juego
- **Crea `cover.png`** - Diseña una imagen de portada de 800x600 píxeles para tu juego
- **Observa el servidor de desarrollo** - Muestra actualizaciones en vivo del tamaño de archivo y restricciones

---

## 🤖 Vibecodea Tu Juego

¡Este desafío está diseñado para **vibecoding** - construir tu juego con asistencia de IA!

### Lo Que Hemos Configurado Para Ti

- **`AGENTS.md`** - Instrucciones pre-configuradas para que tu IDE (Cursor, Windsurf, etc.) entienda el desafío
- **`docs/phaser-quick-start.md`** - Guía de referencia rápida para Phaser 3
- **`docs/phaser-api.md`** - Documentación completa de la API de Phaser 3

Tu agente de IA ya sabe:
- ✅ Todas las restricciones del desafío
- ✅ Cómo usar Phaser 3 efectivamente
- ✅ Mejores prácticas para mantenerse bajo los 50KB
- ✅ Qué archivos editar (solo `game.js` y `metadata.json`)

### Cómo Vibecodear

¡Simplemente dile a tu asistente de IA qué juego quieres construir! Por ejemplo:

> "Crea un clon de Space Invaders con enemigos coloridos"
> 
> "Construye un juego estilo flappy bird con gráficos procedurales"
> 
> "Haz un juego de breakout con power-ups"

¡Tu IA manejará la implementación, manteniendo todo dentro de las restricciones automáticamente!
