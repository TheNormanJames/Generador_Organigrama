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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    // if (this.seleccionado) {
    //   const alto = lineas.length * (this.fontSize + 4);
    //   ctx.strokeStyle = 'black';
    //   ctx.lineWidth = 1;
    //   ctx.strokeRect(
    //     this.x - 5,
    //     this.y - this.fontSize,
    //     this.ancho + 10,
    //     alto + 10
    //   );
    //   ctx.fillStyle = 'red';
    //   ctx.fillRect(this.x + this.ancho + 5, this.y - this.fontSize, 8, 8);
    // }
    if (this.seleccionado || this === textoRedimensionando) {
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
canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
  arrastrando = true;
  textoRedimensionando = null;

  // Ver si hizo clic en el handler de redimensionado
  for (const obj of objetos) {
    if (obj instanceof Texto && obj.estaSobreHandler(offsetX, offsetY)) {
      textoRedimensionando = obj;
      arrastrando = true;
      return; // solo redimensiona
    }
  }

  objetosSeleccionados = objetos.filter((obj) => {
    if (obj.contienePunto(offsetX, offsetY)) {
      obj.seleccionado = true;
      offsets.set(obj, { dx: offsetX - obj.x, dy: offsetY - obj.y });
      return true;
    }
    return false;
  });

  if (conectandoFlecha && objetosSeleccionados.length === 1) {
    if (!puntoInicioFlecha) {
      puntoInicioFlecha = objetosSeleccionados[0];
    } else {
      const flecha = new Flecha(puntoInicioFlecha, objetosSeleccionados[0]);
      objetos.unshift(flecha); // para que esté al fondo
      conectandoFlecha = false;
      puntoInicioFlecha = null;
    }
  }

  guardarHistorial();
  dibujar();
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
  let hoverResize = false;

  // Mostrar cursor de resize si está sobre handler
  for (const obj of objetos) {
    if (obj instanceof Texto && obj.estaSobreHandler(offsetX, offsetY)) {
      canvas.style.cursor = 'ew-resize';
      hoverResize = true;
      break;
    }
  }

  if (!hoverResize) {
    canvas.style.cursor = arrastrando ? 'grabbing' : 'default';
  }

  if (arrastrando && textoRedimensionando) {
    const nuevoAncho = Math.max(30, offsetX - textoRedimensionando.x);
    textoRedimensionando.ancho = nuevoAncho;
    dibujar();
    return;
  }

  if (!arrastrando) return;

  objetosSeleccionados.forEach((obj) => {
    const o = offsets.get(obj);
    if (o) {
      obj.x = Math.round((offsetX - o.dx) / gridSize) * gridSize;
      obj.y = Math.round((offsetY - o.dy) / gridSize) * gridSize;
    }
  });
  dibujar();
});

canvas.addEventListener('mouseup', () => {
  arrastrando = false;
  objetosSeleccionados.forEach((obj) => (obj.seleccionado = false));
  offsets.clear();
  dibujar();
  textoRedimensionando = null;
});

canvas.addEventListener(
  'dblclick',
  ({ clientX, clientY, offsetX, offsetY }) => {
    for (const obj of objetos) {
      if (obj instanceof Circulo && obj.contienePunto(offsetX, offsetY)) {
        mostrarPopup(obj, clientX, clientY);
        return;
      }
      if (obj instanceof Texto && obj.contienePunto(offsetX, offsetY)) {
        objetoEditando = obj;
        obj.seleccionado = true;
        document.addEventListener('keydown', manejarEntrada);
        canvas.addEventListener('mousedown', finalizarEdicion);
        return;
      }
    }
  }
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

dibujar();
