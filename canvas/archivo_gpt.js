// Archivo único optimizado: mini Figma simplificado

const canvas = document.getElementById('miCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 4;

let objetos = [],
  objetosSeleccionados = [],
  objetoEditando = null,
  conectandoFlecha = false,
  puntoInicioFlecha = null;
let arrastrando = false;
const gridSize = 20;
let textoRedimensionando = null;
let zoom = 1;
let offsetCanvas = { x: 0, y: 0 };
let desplazandoCanvas = false;
let ultimaPosMouse = { x: 0, y: 0 };
let modoPanActivo = false;

// Crear popup flotante
const popup = document.createElement('div');
popup.style.position = 'absolute';
popup.style.padding = '10px';
popup.style.background = 'white';
popup.style.border = '1px solid black';
popup.style.display = 'none';
popup.innerHTML = `
  <input type="text" placeholder="URL de imagen" id="imgUrl" style="display:block; margin-bottom:5px; width: 200px;"/>
  <input type="file" id="imgFile" accept="image/*"/>
`;
document.body.appendChild(popup);

const imgUrlInput = popup.querySelector('#imgUrl');
const imgFileInput = popup.querySelector('#imgFile');

// Utilidades
const dibujar = () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(zoom, 0, 0, zoom, offsetCanvas.x, offsetCanvas.y); // aplicar zoom + desplazamiento

  objetos
    .filter((obj) => obj instanceof Flecha)
    .forEach((obj) => obj.dibujar(ctx));
  objetos
    .filter((obj) => !(obj instanceof Flecha))
    .forEach((obj) => obj.dibujar(ctx));
};

let historial = [],
  indiceHistorial = -1;

function guardarHistorial() {
  historial = historial.slice(0, indiceHistorial + 1);
  const snapshot = JSON.stringify(objetos);
  historial.push(snapshot);
  if (historial.length > 20) historial.shift(); // mantener últimos 20 estados
  indiceHistorial = historial.length - 1;
}

// Clases
class Circulo {
  constructor(x, y, radio, color) {
    Object.assign(this, {
      x,
      y,
      radio,
      color,
      seleccionado: false,
      imagen: null,
    });
  }
  dibujar(ctx) {
    if (this.imagen) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        this.imagen,
        this.x - this.radio,
        this.y - this.radio,
        this.radio * 2,
        this.radio * 2
      );
      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (this.seleccionado) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  contienePunto(x, y) {
    return Math.hypot(x - this.x, y - this.y) < this.radio;
  }
}

class Texto {
  constructor(x, y, texto, fontSize = 16, color = 'black', ancho = 200) {
    Object.assign(this, {
      x,
      y,
      texto,
      fontSize,
      color,
      seleccionado: false,
      ancho,
    });
  }
  dibujar(ctx) {
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px Arial`;
    const lineas = [];
    let palabras = this.texto.split(' ');
    let linea = '';
    for (let palabra of palabras) {
      const prueba = linea + palabra + ' ';
      if (ctx.measureText(prueba).width > this.ancho) {
        lineas.push(linea);
        linea = palabra + ' ';
      } else {
        linea = prueba;
      }
    }
    lineas.push(linea);

    lineas.forEach((l, i) => {
      ctx.fillText(l.trim(), this.x, this.y + i * (this.fontSize + 4));
    });

    if (this.seleccionado || this === textoRedimensionando) {
      const alto = lineas.length * (this.fontSize + 4);
      ctx.strokeStyle = '#000000cc';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        this.x - 5,
        this.y - this.fontSize,
        this.ancho + 10,
        alto + 10
      );

      ctx.fillStyle = 'red';
      ctx.fillRect(this.x + this.ancho + 5, this.y - this.fontSize, 8, 8);
    }
  }
  contienePunto(x, y) {
    return (
      x > this.x &&
      x < this.x + this.ancho &&
      y > this.y - this.fontSize &&
      y < this.y + 100 // aproximado para selección
    );
  }
  estaSobreHandler(x, y) {
    return (
      x > this.x + this.ancho + 5 &&
      x < this.x + this.ancho + 13 &&
      y > this.y - this.fontSize &&
      y < this.y - this.fontSize + 8
    );
  }
}

class Flecha {
  constructor(origen, destino, color = 'black') {
    this.origen = origen;
    this.destino = destino;
    this.color = color;
  }
  dibujar(ctx) {
    const { x: x1, y: y1 } = calcularBorde(this.origen, this.destino);
    const { x: x2, y: y2 } = calcularBorde(this.destino, this.origen);

    const obstaculo = objetos.find(
      (obj) =>
        obj !== this.origen &&
        obj !== this.destino &&
        intersecta({ x1, y1, x2, y2 }, obj)
    );

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (obstaculo) {
      const medioX = (x1 + x2) / 2;
      ctx.moveTo(x1, y1);
      ctx.lineTo(medioX, y1);
      ctx.lineTo(medioX, y2);
      ctx.lineTo(x2, y2);
    } else {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }
  contienePunto() {
    return false;
  }
}

function calcularBorde(origen, destino) {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  const ang = Math.atan2(dy, dx);
  const r = origen.radio || 0;
  return {
    x: origen.x + r * Math.cos(ang),
    y: origen.y + r * Math.sin(ang),
  };
}

function intersecta(linea, obj) {
  const margen = 10;
  const minX = Math.min(linea.x1, linea.x2);
  const maxX = Math.max(linea.x1, linea.x2);
  const minY = Math.min(linea.y1, linea.y2);
  const maxY = Math.max(linea.y1, linea.y2);

  if (obj instanceof Circulo) {
    return (
      obj.x + obj.radio > minX - margen &&
      obj.x - obj.radio < maxX + margen &&
      obj.y + obj.radio > minY - margen &&
      obj.y - obj.radio < maxY + margen
    );
  } else if (obj instanceof Texto) {
    return (
      obj.x < maxX + margen &&
      obj.x + obj.ancho > minX - margen &&
      obj.y < maxY + margen &&
      obj.y > minY - margen
    );
  }
  return false;
}

// Agregar objetos
const crear = (tipo) => {
  if (tipo === 'circulo') objetos.push(new Circulo(100, 100, 30, 'blue'));
  else if (tipo === 'texto') objetos.push(new Texto(150, 150, 'Hola!', 18));
  else if (tipo === 'flechaConectada') conectandoFlecha = true;
  dibujar();
};

document.getElementById('circleBtn').onclick = () => crear('circulo');
document.getElementById('circleTexto').onclick = () => crear('texto');
document.getElementById('circleFlecha').onclick = () =>
  crear('flechaConectada');

// Interacción
let offsets = new Map();
canvas.addEventListener('mousedown', ({ offsetX, offsetY, shiftKey }) => {
  const { x, y } = transformarCoordenadas(offsetX, offsetY);

  actualizarCursor(x, y);
  arrastrando = true;
  textoRedimensionando = null;
  objetosSeleccionados = [];

  // Check si hizo clic sobre un handler de texto
  for (const obj of objetos) {
    if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
      textoRedimensionando = obj;
      return;
    }
  }

  // Buscar qué objetos se están tocando
  for (const obj of objetos) {
    if (obj.contienePunto(x, y)) {
      if (shiftKey) {
        // Añadir a la selección
        if (!objetosSeleccionados.includes(obj)) {
          objetosSeleccionados.push(obj);
          obj.seleccionado = true;
        }
      } else {
        // Selección única
        objetos.forEach((o) => (o.seleccionado = false));
        objetosSeleccionados = [obj];
        obj.seleccionado = true;
      }
      offsets.set(obj, { dx: x - obj.x, dy: y - obj.y });
    }
  }

  if (conectandoFlecha && objetosSeleccionados.length === 1) {
    if (!puntoInicioFlecha) {
      puntoInicioFlecha = objetosSeleccionados[0];
    } else {
      const flecha = new Flecha(puntoInicioFlecha, objetosSeleccionados[0]);
      objetos.unshift(flecha);
      conectandoFlecha = false;
      puntoInicioFlecha = null;
    }
  }

  guardarHistorial();
  dibujar();
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
  const { x, y } = transformarCoordenadas(offsetX, offsetY);
  actualizarCursor(x, y);

  let hoverResize = false;

  // Mostrar cursor de resize si está sobre handler
  for (const obj of objetos) {
    if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
      canvas.style.cursor = 'ew-resize';
      hoverResize = true;
      break;
    }
  }

  if (!hoverResize) {
    canvas.style.cursor = arrastrando ? 'grabbing' : 'default';
  }

  if (arrastrando && textoRedimensionando) {
    const nuevoAncho = Math.max(30, x - textoRedimensionando.x);
    textoRedimensionando.ancho = nuevoAncho;
    dibujar();
    return;
  }

  if (!arrastrando) return;

  objetosSeleccionados.forEach((obj) => {
    const o = offsets.get(obj);
    if (o) {
      obj.x = Math.round((x - o.dx) / gridSize) * gridSize;
      obj.y = Math.round((y - o.dy) / gridSize) * gridSize;
    }
  });
  dibujar();
});

canvas.addEventListener('mouseup', ({ offsetX, offsetY }) => {
  const { x, y } = transformarCoordenadas(offsetX, offsetY);
  arrastrando = false;
  objetosSeleccionados.forEach((obj) => (obj.seleccionado = false));
  offsets.clear();
  dibujar();
  textoRedimensionando = null;
  actualizarCursor(x, y);
});

canvas.addEventListener(
  'dblclick',
  ({ clientX, clientY, offsetX, offsetY }) => {
    const { x, y } = transformarCoordenadas(offsetX, offsetY);
    for (const obj of objetos) {
      if (obj instanceof Circulo && obj.contienePunto(x, y)) {
        mostrarPopup(obj, clientX, clientY);
        return;
      }
      if (obj instanceof Texto && obj.contienePunto(x, y)) {
        objetoEditando = obj;
        obj.seleccionado = true;
        document.addEventListener('keydown', manejarEntrada);
        canvas.addEventListener('mousedown', finalizarEdicion);
        return;
      }
    }
  }
);

canvas.addEventListener('mousedown', (e) => {
  if (modoPanActivo) {
    desplazandoCanvas = true;
    ultimaPosMouse = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (desplazandoCanvas) {
    const dx = e.clientX - ultimaPosMouse.x;
    const dy = e.clientY - ultimaPosMouse.y;
    offsetCanvas.x += dx;
    offsetCanvas.y += dy;
    ultimaPosMouse = { x: e.clientX, y: e.clientY };
    dibujar();
    return;
  }
});

canvas.addEventListener('mouseup', () => {
  if (desplazandoCanvas) {
    desplazandoCanvas = false;
    canvas.style.cursor = modoPanActivo ? 'grab' : 'default';
  }
});

canvas.addEventListener(
  'wheel',
  (e) => {
    if (!e.ctrlKey) return;

    e.preventDefault();

    const zoomFactor = 1.1;
    const { offsetX, offsetY } = e;
    const { x: mx, y: my } = transformarCoordenadas(offsetX, offsetY);

    const nuevoZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;

    // mantener punto del mouse centrado al hacer zoom
    offsetCanvas.x -= mx * nuevoZoom - mx * zoom;
    offsetCanvas.y -= my * nuevoZoom - my * zoom;
    zoom = nuevoZoom;

    dibujar();
  },
  { passive: false }
);

function mostrarPopup(circulo, x, y) {
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  popup.style.display = 'block';
  imgUrlInput.value = '';
  imgFileInput.value = '';

  const listenerUrl = () => {
    const url = imgUrlInput.value;
    const img = new Image();
    img.onload = () => {
      circulo.imagen = img;
      dibujar();
      ocultarPopup();
    };
    img.src = url;
  };

  imgUrlInput.onchange = listenerUrl;
  imgFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          circulo.imagen = img;
          dibujar();
          ocultarPopup();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ocultarPopup();
    finalizarEdicion();
  }
  if (e.code === 'Space' && !modoPanActivo) {
    modoPanActivo = true;
    canvas.style.cursor = 'grab';
  }
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    modoPanActivo = false;
    desplazandoCanvas = false;
    canvas.style.cursor = 'default';
  }
});

function ocultarPopup() {
  popup.style.display = 'none';
  imgUrlInput.value = '';
  imgFileInput.value = '';
}

function manejarEntrada(e) {
  if (!objetoEditando) return;
  if (e.key === 'Escape') return finalizarEdicion();
  if (e.key === 'Backspace')
    objetoEditando.texto = objetoEditando.texto.slice(0, -1);
  else if (e.key.length === 1) objetoEditando.texto += e.key;
  canvas.style.cursor = 'text';

  dibujar();
}

function finalizarEdicion() {
  if (objetoEditando) objetoEditando.seleccionado = false;
  objetoEditando = null;
  document.removeEventListener('keydown', manejarEntrada);
  canvas.removeEventListener('mousedown', finalizarEdicion);
  dibujar();
}

// Z-index
const moverZ = (dir) => {
  objetosSeleccionados.forEach((obj) => {
    const i = objetos.indexOf(obj);
    objetos.splice(i, 1);
    dir === 'frente' ? objetos.push(obj) : objetos.unshift(obj);
  });
  dibujar();
};

document.getElementById('btnFrente').onclick = () => moverZ('frente');
document.getElementById('btnFondo').onclick = () => moverZ('fondo');

// Exportar / Importar
function exportarJSON() {
  const data = JSON.stringify(objetos);
  const blob = new Blob([data], { type: 'application/json' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = 'mini_figma_design.json';
  enlace.click();
}

document.getElementById('btnExportar').onclick = exportarJSON;

document.getElementById('btnImportar').onchange = (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = ({ target }) => {
    try {
      const parsed = JSON.parse(target.result);
      objetos = parsed
        .map((obj) => {
          if (obj.radio) return new Circulo(obj.x, obj.y, obj.radio, obj.color);
          if (obj.texto)
            return new Texto(
              obj.x,
              obj.y,
              obj.texto,
              obj.fontSize,
              obj.color,
              obj.ancho
            );
          if (obj.origen && obj.destino)
            return new Flecha(obj.origen, obj.destino, obj.color);
          return null;
        })
        .filter(Boolean);
      dibujar();
    } catch (e) {
      console.error('Importación fallida', e);
    }
  };
  lector.readAsText(archivo);
};

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') return deshacer();
  if (e.ctrlKey && e.key === 'y') return rehacer();
  if (e.ctrlKey && e.key === 'd') return duplicar();
  if (e.key === 'Delete') return eliminar();
});

function duplicar() {
  guardarHistorial();
  objetosSeleccionados.forEach((obj) => {
    let copia = null;
    if (obj instanceof Circulo)
      copia = new Circulo(obj.x + 20, obj.y + 20, obj.radio, obj.color);
    else if (obj instanceof Texto)
      copia = new Texto(
        obj.x + 20,
        obj.y + 20,
        obj.texto,
        obj.fontSize,
        obj.color,
        obj.ancho
      );
    if (copia) objetos.push(copia);
  });
  guardarHistorial();
  dibujar();
}

function eliminar() {
  objetos = objetos.filter((obj) => !objetosSeleccionados.includes(obj));
  guardarHistorial();
  dibujar();
}

function deshacer() {
  if (indiceHistorial > 0) {
    indiceHistorial--;
    const estadoPrevio = JSON.parse(historial[indiceHistorial]);
    restaurarEstado(estadoPrevio);
  }
}

function rehacer() {
  if (indiceHistorial < historial.length - 1) {
    indiceHistorial++;
    const estadoFuturo = JSON.parse(historial[indiceHistorial]);
    restaurarEstado(estadoFuturo);
  }
}
function restaurarEstado(estado) {
  objetos = estado
    .map((obj) => {
      if (obj.radio) return new Circulo(obj.x, obj.y, obj.radio, obj.color);
      if (obj.texto)
        return new Texto(
          obj.x,
          obj.y,
          obj.texto,
          obj.fontSize,
          obj.color,
          obj.ancho
        );
      if (obj.origen && obj.destino)
        return new Flecha(obj.origen, obj.destino, obj.color);
      return null;
    })
    .filter(Boolean);
  dibujar();
}

function actualizarCursor(offsetX, offsetY) {
  const { x, y } = transformarCoordenadas(offsetX, offsetY);
  if (textoRedimensionando) {
    canvas.style.cursor = 'ew-resize';
    return;
  }

  for (const obj of objetos) {
    if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
      canvas.style.cursor = 'ew-resize';
      return;
    }
  }

  if (conectandoFlecha) {
    canvas.style.cursor = 'crosshair';
    return;
  }

  const hovering = objetos.some((obj) => obj.contienePunto(x, y));
  if (hovering) {
    canvas.style.cursor = arrastrando ? 'grabbing' : 'move';
  } else {
    canvas.style.cursor = 'default';
  }
}
function transformarCoordenadas(x, y) {
  return {
    x: (x - offsetCanvas.x) / zoom,
    y: (y - offsetCanvas.y) / zoom,
  };
}

dibujar();
