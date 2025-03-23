import {
  lineaSeleccionada,
  numCirculo,
  setLineaSeleccionada,
  setNumCirculo,
} from './variables.js';

// Función para hacer el elemento arrastrable
export function hacerArrastrable(elemento) {
  let isDragging = false;
  let offsetX, offsetY;

  elemento.addEventListener('mousedown', function (e) {
    isDragging = true;
    offsetX = e.clientX - elemento.offsetLeft;
    offsetY = e.clientY - elemento.offsetTop;
    elemento.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function (e) {
    if (isDragging) {
      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;
      elemento.style.left = x + 'px';
      elemento.style.top = y + 'px';
    }
  });

  document.addEventListener('mouseup', function () {
    isDragging = false;
    elemento.style.cursor = 'grab';
  });
}

// Función para permitir redimensionar el elemento
export function hacerRedimensionable(elemento) {
  let isResizing = false;
  let initialWidth, initialHeight, initialX, initialY;

  const resizeControl = document.createElement('div');
  resizeControl.classList.add('control-resize');
  elemento.appendChild(resizeControl);

  resizeControl.addEventListener('mousedown', function (e) {
    e.preventDefault();
    isResizing = true;
    initialWidth = parseInt(window.getComputedStyle(elemento).width, 10);
    initialHeight = parseInt(window.getComputedStyle(elemento).height, 10);
    initialX = e.clientX;
    initialY = e.clientY;
    document.body.style.cursor = 'se-resize'; // Cambiar el cursor a "redimensionar"
  });

  document.addEventListener('mousemove', function (e) {
    if (isResizing) {
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;

      elemento.style.width = initialWidth + dx + 'px';
      elemento.style.height = initialHeight + dy + 'px';
    }
  });

  document.addEventListener('mouseup', function () {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default'; // Restaurar el cursor normal
    }
  });
}

export function activarBotonesDeTamano(linea) {
  document.getElementById('aumentarLinea').disabled = false;
  document.getElementById('disminuirLinea').disabled = false;

  document.getElementById('aumentarLinea').onclick = function () {
    if (lineaSeleccionada) {
      if (lineaSeleccionada.classList.contains('linea-vertical')) {
        let alturaActual = parseInt(lineaSeleccionada.style.height);
        lineaSeleccionada.style.height = alturaActual + 10 + 'px';
      } else if (lineaSeleccionada.classList.contains('linea-horizontal')) {
        let anchoActual = parseInt(lineaSeleccionada.style.width);
        lineaSeleccionada.style.width = anchoActual + 10 + 'px';
      }
    }
  };

  document.getElementById('disminuirLinea').onclick = function () {
    if (lineaSeleccionada) {
      if (lineaSeleccionada.classList.contains('linea-vertical')) {
        let alturaActual = parseInt(lineaSeleccionada.style.height);
        if (alturaActual > 20) {
          lineaSeleccionada.style.height = alturaActual - 10 + 'px';
        }
      } else if (lineaSeleccionada.classList.contains('linea-horizontal')) {
        let anchoActual = parseInt(lineaSeleccionada.style.width);
        if (anchoActual > 20) {
          lineaSeleccionada.style.width = anchoActual - 10 + 'px';
        }
      }
    }
  };
}

export function agregarSeleccion(elemento) {
  elemento.addEventListener('click', function () {
    let elementos = document.querySelectorAll('.movible, .linea');
    elementos.forEach(function (el) {
      el.classList.remove('seleccionado');
      let iconoSubir = el.querySelector('.icono-subir-imagen');
      let iconoURL = el.querySelector('.icono-url');
      let iconoBorrar = el.querySelector('.icono-borrar');

      if (iconoSubir) iconoSubir.style.display = 'none';
      if (iconoURL) iconoURL.style.display = 'none';
      if (iconoBorrar) iconoBorrar.style.display = 'none';
    });

    elemento.classList.add('seleccionado');
    let iconoSubir = elemento.querySelector('.icono-subir-imagen');
    let iconoURL = elemento.querySelector('.icono-url');
    let iconoBorrar = elemento.querySelector('.icono-borrar');

    if (iconoSubir) iconoSubir.style.display = 'block';
    if (iconoURL) iconoURL.style.display = 'block';
    if (iconoBorrar) iconoBorrar.style.display = 'block';

    setLineaSeleccionada(elemento);
  });
}
