// alert("asd");

// Archivo único optimizado: mini Figma simplificado

const canvas = document.getElementById('miCanvas');
const ctx = canvas.getContext('2d');

let objetos = [],
  objetosSeleccionados = [],
  objetoEditando = null;
let arrastrando = false;
const gridSize = 20;

// Crear popup flotante para imagen
const popup = document.createElement('div');
popup.style.position = 'absolute';
popup.style.display = 'none';
popup.style.background = 'white';
popup.style.border = '1px solid black';
popup.style.padding = '10px';
popup.style.zIndex = 1000;
popup.innerHTML = `
  <input type="text" id="urlInput" placeholder="URL de imagen" style="display:block; margin-bottom:5px;" />
  <input type="file" id="fileInput" accept="image/*" style="display:block; margin-bottom:5px;" />
  <button id="setImageBtn">Establecer Imagen</button>
`;
document.body.appendChild(popup);

let circuloSeleccionadoParaImagen = null;

// Utilidades
const dibujar = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objetos.forEach((obj) => obj.dibujar(ctx));
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
  constructor(x, y, radio, color, imagen = null) {
    Object.assign(this, { x, y, radio, color, imagen, seleccionado: false });
  }
  dibujar(ctx) {
    if (this.imagen) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(
          img,
          this.x - this.radio,
          this.y - this.radio,
          this.radio * 2,
          this.radio * 2
        );
        ctx.restore();
        if (this.seleccionado) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
          ctx.stroke();
        }
      };
      img.src = this.imagen;
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
      ctx.fill();
      if (this.seleccionado) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
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
  constructor(xInicio, yInicio, xFin, yFin, color = 'black') {
    Object.assign(this, { xInicio, yInicio, xFin, yFin, color });
  }
  dibujar(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.xInicio, this.yInicio);
    ctx.lineTo(this.xFin, this.yFin);
    ctx.stroke();
  }
  contienePunto() {
    return false;
  }
}

// Agregar objetos
const crear = (tipo) => {
  if (tipo === 'circulo') objetos.push(new Circulo(100, 100, 30, 'blue'));
  else if (tipo === 'texto') objetos.push(new Texto(150, 150, 'Hola!', 18));
  else if (tipo === 'flecha') objetos.push(new Flecha(200, 200, 300, 300));
  dibujar();
};

document.getElementById('circleBtn').onclick = () => crear('circulo');
document.getElementById('circleTexto').onclick = () => crear('texto');
document.getElementById('circleFlecha').onclick = () => crear('flecha');

// Interacción
let offsets = new Map();
canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
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

// Doble clic en círculo para popup
canvas.addEventListener('dblclick', ({ offsetX, offsetY }) => {
  for (const obj of objetos) {
    if (obj instanceof Circulo && obj.contienePunto(offsetX, offsetY)) {
      circuloSeleccionadoParaImagen = obj;
      popup.style.left = `${offsetX + canvas.offsetLeft}px`;
      popup.style.top = `${offsetY + canvas.offsetTop}px`;
      popup.style.display = 'block';
      return;
    }
  }
  for (const obj of objetos) {
    if (obj instanceof Texto && obj.contienePunto(offsetX, offsetY)) {
      objetoEditando = obj;
      obj.seleccionado = true;
      document.addEventListener('keydown', manejarEntrada);
      canvas.addEventListener('mousedown', finalizarEdicion);
      break;
    }
  }
});

document.getElementById('setImageBtn').onclick = () => {
  if (!circuloSeleccionadoParaImagen) return;
  const url = document.getElementById('urlInput').value;
  const file = document.getElementById('fileInput').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      circuloSeleccionadoParaImagen.imagen = e.target.result;
      popup.style.display = 'none';
      dibujar();
    };
    reader.readAsDataURL(file);
  } else if (url) {
    circuloSeleccionadoParaImagen.imagen = url;
    popup.style.display = 'none';
    dibujar();
  }
};

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
        .map((obj) =>
          obj.radio
            ? new Circulo(obj.x, obj.y, obj.radio, obj.color, obj.imagen)
            : obj.texto
            ? new Texto(obj.x, obj.y, obj.texto, obj.fontSize, obj.color)
            : obj.xInicio
            ? new Flecha(
                obj.xInicio,
                obj.yInicio,
                obj.xFin,
                obj.yFin,
                obj.color
              )
            : null
        )
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
        obj.imagen
      );
    else if (obj instanceof Texto)
      copia = new Texto(
        obj.x + 20,
        obj.y + 20,
        obj.texto,
        obj.fontSize,
        obj.color
      );
    else if (obj instanceof Flecha)
      copia = new Flecha(
        obj.xInicio + 20,
        obj.yInicio + 20,
        obj.xFin + 20,
        obj.yFin + 20,
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

function deshacer() {
  /* ver guardarHistorial: closure interno maneja historial */
}
function rehacer() {
  /* idem */
}

dibujar();
