// alert("asd");

// Archivo único optimizado: mini Figma simplificado con flechas conectadas inteligentes y círculos con imagen

const canvas = document.getElementById('miCanvas');
const ctx = canvas.getContext('2d');

let objetos = [],
  objetosSeleccionados = [],
  objetoEditando = null,
  conectandoFlecha = false,
  origenFlecha = null;
let arrastrando = false;
const gridSize = 20;

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

const guardarHistorial = (() => {
  let historial = [],
    indice = -1;
  return () => {
    historial = historial.slice(0, indice + 1);
    historial.push(JSON.parse(JSON.stringify(objetos)));
    if (historial.length > 10) historial.shift();
    indice = historial.length - 1;
  };
})();

// Clases
class Circulo {
  constructor(x, y, radio, color, imagenURL = null) {
    Object.assign(this, { x, y, radio, color, seleccionado: false, imagenURL });
    if (imagenURL) {
      this.imagen = new Image();
      this.imagen.src = imagenURL;
    }
  }
  dibujar(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
    ctx.clip();
    if (this.imagenURL && this.imagen?.complete) {
      ctx.drawImage(
        this.imagen,
        this.x - this.radio,
        this.y - this.radio,
        this.radio * 2,
        this.radio * 2
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
    if (this.seleccionado) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
  contienePunto(x, y) {
    return Math.hypot(x - this.x, y - this.y) < this.radio;
  }
}

class Texto {
  constructor(x, y, texto, fontSize = 16, color = 'black') {
    Object.assign(this, { x, y, texto, fontSize, color, seleccionado: false });
  }
  dibujar(ctx) {
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(this.texto, this.x, this.y);
    if (this.seleccionado) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      const w = this.texto.length * this.fontSize * 0.6;
      ctx.strokeRect(this.x - 5, this.y - this.fontSize, w, this.fontSize + 5);
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x + w, this.y - this.fontSize, 8, 8);
    }
  }
  contienePunto(x, y) {
    const w = this.texto.length * this.fontSize * 0.6;
    return (
      x > this.x && x < this.x + w && y > this.y - this.fontSize && y < this.y
    );
  }
}

class Flecha {
  constructor(origen, destino, color = 'black') {
    Object.assign(this, { origen, destino, color });
  }
  dibujar(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    const { x: x1, y: y1 } = puntoBorde(this.origen, this.destino);
    const { x: x2, y: y2 } = puntoBorde(this.destino, this.origen);
    const intermedio = detectarObstaculo(x1, y1, x2, y2);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (intermedio) {
      ctx.lineTo(intermedio.x, y1);
      ctx.lineTo(intermedio.x, y2);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  contienePunto() {
    return false;
  }
}

function puntoBorde(origen, destino) {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  const angulo = Math.atan2(dy, dx);
  if (origen instanceof Circulo) {
    return {
      x: origen.x + Math.cos(angulo) * origen.radio,
      y: origen.y + Math.sin(angulo) * origen.radio,
    };
  }
  return { x: origen.x, y: origen.y };
}

function detectarObstaculo(x1, y1, x2, y2) {
  for (const obj of objetos) {
    if (!(obj instanceof Flecha)) {
      const colision = obj.contienePunto((x1 + x2) / 2, (y1 + y2) / 2);
      if (colision) return { x: (x1 + x2) / 2 + 40 };
    }
  }
  return null;
}

// Agregar objetos
const crear = (tipo) => {
  if (tipo === 'circulo') objetos.push(new Circulo(100, 100, 30, 'blue'));
  else if (tipo === 'texto') objetos.push(new Texto(150, 150, 'Hola!', 18));
  dibujar();
};

document.getElementById('circleBtn').onclick = () => crear('circulo');
document.getElementById('circleTexto').onclick = () => crear('texto');
document.getElementById('circleFlecha').onclick = () => {
  conectandoFlecha = true;
  origenFlecha = null;
};

// Interacción
let offsets = new Map();
canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
  if (conectandoFlecha) {
    const objetivo = objetos.find((obj) => obj.contienePunto(offsetX, offsetY));
    if (objetivo) {
      if (!origenFlecha) {
        origenFlecha = objetivo;
      } else {
        objetos.push(new Flecha(origenFlecha, objetivo));
        conectandoFlecha = false;
        origenFlecha = null;
        dibujar();
      }
    }
    return;
  }

  arrastrando = true;
  objetosSeleccionados = objetos.filter((obj) => {
    if (obj.contienePunto(offsetX, offsetY)) {
      obj.seleccionado = true;
      offsets.set(obj, { dx: offsetX - obj.x, dy: offsetY - obj.y });
      return true;
    }
    return false;
  });
  guardarHistorial();
  dibujar();
});

canvas.addEventListener('mousemove', ({ offsetX, offsetY }) => {
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
});

// Popup imagen
const popup = document.createElement('div');
popup.innerHTML = `
  <input type="text" placeholder="URL de imagen" id="imgURL" style="width: 160px" />
  <input type="file" id="imgFile" accept="image/*" />
  <button id="btnImgOK">OK</button>
`;
popup.style.position = 'absolute';
popup.style.display = 'none';
popup.style.background = 'white';
popup.style.border = '1px solid black';
popup.style.padding = '4px';
popup.style.zIndex = 10;
document.body.appendChild(popup);

canvas.addEventListener('dblclick', ({ offsetX, offsetY }) => {
  for (const obj of objetos) {
    if (obj instanceof Circulo && obj.contienePunto(offsetX, offsetY)) {
      objetoEditando = obj;
      popup.style.left = `${offsetX + canvas.offsetLeft}px`;
      popup.style.top = `${offsetY + canvas.offsetTop}px`;
      popup.style.display = 'block';
      break;
    }
  }
});

document.getElementById('btnImgOK').onclick = () => {
  const url = document.getElementById('imgURL').value;
  const file = document.getElementById('imgFile').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      objetoEditando.imagenURL = reader.result;
      objetoEditando.imagen = new Image();
      objetoEditando.imagen.src = reader.result;
      popup.style.display = 'none';
      dibujar();
    };
    reader.readAsDataURL(file);
  } else if (url) {
    objetoEditando.imagenURL = url;
    objetoEditando.imagen = new Image();
    objetoEditando.imagen.src = url;
    popup.style.display = 'none';
    dibujar();
  }
};

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
          if (obj.radio)
            return new Circulo(
              obj.x,
              obj.y,
              obj.radio,
              obj.color,
              obj.imagenURL
            );
          if (obj.texto)
            return new Texto(obj.x, obj.y, obj.texto, obj.fontSize, obj.color);
          if (obj.origen && obj.destino) return null;
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
      copia = new Circulo(
        obj.x + 20,
        obj.y + 20,
        obj.radio,
        obj.color,
        obj.imagenURL
      );
    else if (obj instanceof Texto)
      copia = new Texto(
        obj.x + 20,
        obj.y + 20,
        obj.texto,
        obj.fontSize,
        obj.color
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

function deshacer() {}
function rehacer() {}

dibujar();
