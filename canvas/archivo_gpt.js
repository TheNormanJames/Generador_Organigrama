// alert("asd");

// Archivo único optimizado: mini Figma simplificado

const canvas = document.getElementById('miCanvas');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 20;
const ctx = canvas.getContext('2d');

let objetos = [],
  objetosSeleccionados = [],
  objetoEditando = null;
let arrastrando = false;
const gridSize = 20;

let modoCreacionFlecha = false;
let objInicioFlecha = null;

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
  constructor(x, y, radio, color) {
    Object.assign(this, { x, y, radio, color, seleccionado: false });
  }
  dibujar(ctx) {
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

function obtenerPuntoBorde(obj, x, y) {
  if (obj instanceof Circulo) {
    // Encontramos el punto más cercano del borde de un círculo
    const angle = Math.atan2(y - obj.y, x - obj.x);
    const xBorde = obj.x + obj.radio * Math.cos(angle);
    const yBorde = obj.y + obj.radio * Math.sin(angle);
    return { x: xBorde, y: yBorde };
  } else if (obj instanceof Texto) {
    // Encontramos el punto más cercano de un texto (usamos el borde del rectángulo del texto)
    const w = obj.texto.length * obj.fontSize * 0.6;
    const h = obj.fontSize;
    const angle = Math.atan2(y - obj.y, x - obj.x);

    // Determinamos el punto en el borde
    const xBorde = obj.x + (w / 2) * Math.cos(angle);
    const yBorde = obj.y + (h / 2) * Math.sin(angle);
    return { x: xBorde, y: yBorde };
  } else {
    // Para futuros objetos, se pueden agregar casos adicionales
    return { x: obj.x, y: obj.y }; // Retornamos la posición central para ahora
  }
}
class Flecha {
  constructor(
    xInicio,
    yInicio,
    xFin,
    yFin,
    color = 'black',
    tipo = 'dinamica'
  ) {
    Object.assign(this, { xInicio, yInicio, xFin, yFin, color, tipo });
  }

  dibujar(ctx) {
    // Si la flecha es dinámica, recalculamos su fin basándonos en el objeto al que apunta
    if (this.tipo === 'dinamica') {
      const objInicio = objetos.find((obj) => obj.seleccionado);
      const objFin = objetos.find((obj) => obj.seleccionado);
      if (objInicio && objFin) {
        const { x: nuevoInicioX, y: nuevoInicioY } = obtenerPuntoBorde(
          objInicio,
          this.xInicio,
          this.yInicio
        );
        const { x: nuevoFinX, y: nuevoFinY } = obtenerPuntoBorde(
          objFin,
          this.xFin,
          this.yFin
        );
        this.xInicio = nuevoInicioX;
        this.yInicio = nuevoInicioY;
        this.xFin = nuevoFinX;
        this.yFin = nuevoFinY;
      }
    }

    // Dibuja la flecha normalmente
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

class FlechaConectada {
  constructor(objInicio, objFin, color = 'black') {
    this.objInicio = objInicio;
    this.objFin = objFin;
    this.color = color;
  }
  dibujar(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.objInicio.x, this.objInicio.y);
    ctx.lineTo(this.objFin.x, this.objFin.y);
    ctx.stroke();
  }
  contienePunto() {
    return false;
  }
}

const crearFlechaDinamica = () => {
  // Obtener los objetos seleccionados para la conexión
  const objInicio = objetos.find((obj) => obj.seleccionado);
  const objFin = objetos.find((obj) => obj.seleccionado);

  if (objInicio && objFin) {
    const { x: nuevoInicioX, y: nuevoInicioY } = obtenerPuntoBorde(
      objInicio,
      objInicio.x,
      objInicio.y
    );
    const { x: nuevoFinX, y: nuevoFinY } = obtenerPuntoBorde(
      objFin,
      objFin.x,
      objFin.y
    );

    // Crear la flecha dinámica
    objetos.push(
      new Flecha(
        nuevoInicioX,
        nuevoInicioY,
        nuevoFinX,
        nuevoFinY,
        'black',
        'dinamica'
      )
    );
    dibujar();
  }
};

// Agregar objetos
const crear = (tipo) => {
  if (tipo === 'circulo') objetos.push(new Circulo(100, 100, 30, 'blue'));
  else if (tipo === 'texto') objetos.push(new Texto(150, 150, 'Hola!', 18));
  else if (tipo === 'flecha') objetos.push(new Flecha(200, 200, 300, 300));
  dibujar();
};

document.getElementById('circleBtn').onclick = () => crear('circulo');
document.getElementById('circleTexto').onclick = () => crear('texto');
document.getElementById('circleFlecha').onclick = () => crearFlechaDinamica();
document.getElementById('btnFlechaConectada').onclick = () => {
  modoCreacionFlecha = true;
};

// Interacción
let offsets = new Map();
canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
  if (modoCreacionFlecha) {
    objInicioFlecha = objetos.find((obj) =>
      obj.contienePunto(offsetX, offsetY)
    );
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

canvas.addEventListener('mouseup', ({ offsetX, offsetY }) => {
  if (modoCreacionFlecha && objInicioFlecha) {
    const objFinFlecha = objetos.find((obj) =>
      obj.contienePunto(offsetX, offsetY)
    );
    if (objFinFlecha && objFinFlecha !== objInicioFlecha) {
      objetos.push(new FlechaConectada(objInicioFlecha, objFinFlecha));
    }
    objInicioFlecha = null;
    modoCreacionFlecha = false;
    dibujar();
    return;
  }
  arrastrando = false;
  objetosSeleccionados.forEach((obj) => (obj.seleccionado = false));
  offsets.clear();
  dibujar();
});

// Edición de texto
canvas.addEventListener('dblclick', ({ offsetX, offsetY }) => {
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
            ? new Circulo(obj.x, obj.y, obj.radio, obj.color)
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
      copia = new Circulo(obj.x + 20, obj.y + 20, obj.radio, obj.color);
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
