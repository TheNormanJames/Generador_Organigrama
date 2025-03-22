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
export function crearNuevoElemento() {
  setNumCirculo(numCirculo + 1);

  let nuevoElemento = document.createElement('div');
  nuevoElemento.classList.add('movible');
  nuevoElemento.classList.add('circulo_' + numCirculo);

  //nuevoElemento.textContent = "Arrástrame";

  nuevoElemento.style.left = Math.random() * (window.innerWidth - 100) + 'px';
  nuevoElemento.style.top = Math.random() * (window.innerHeight - 100) + 'px';

  document.body.appendChild(nuevoElemento);

  hacerArrastrable(nuevoElemento);
  agregarSeleccion(nuevoElemento);

  let iconoSubir = document.createElement('i');
  iconoSubir.classList.add('fas', 'fa-upload', 'icono-subir-imagen');
  nuevoElemento.appendChild(iconoSubir);

  iconoSubir.addEventListener('click', function (e) {
    document.getElementById('cargarImagen').click();
  });

  let iconoURL = document.createElement('i');
  iconoURL.classList.add('fas', 'fa-link', 'icono-url');
  nuevoElemento.appendChild(iconoURL);

  let inputURLDiv = document.createElement('div');
  inputURLDiv.classList.add('input-url');
  let inputURL = document.createElement('input');
  inputURL.type = 'text';
  inputURL.placeholder = 'Introduce una URL';
  let btnAceptarURL = document.createElement('button');
  btnAceptarURL.textContent = 'Aceptar';

  inputURLDiv.appendChild(inputURL);
  inputURLDiv.appendChild(btnAceptarURL);
  nuevoElemento.appendChild(inputURLDiv);

  iconoURL.addEventListener('click', function (e) {
    e.stopPropagation();
    inputURLDiv.style.display = 'flex'; // Mostrar el input
  });

  btnAceptarURL.addEventListener('click', function () {
    let url = inputURL.value;
    console.log('Click en btnAceptarURL');

    if (url) {
      nuevoElemento.style.backgroundImage = `url(${url})`;
      nuevoElemento.textContent = ''; // Eliminar texto cuando se asigna la imagen
    }
    inputURLDiv.style.display = 'none'; // Ocultar el input
  });

  let iconoBorrar = document.createElement('i');
  iconoBorrar.classList.add('fas', 'fa-trash', 'icono-borrar');
  nuevoElemento.appendChild(iconoBorrar);

  iconoBorrar.addEventListener('click', function (e) {
    e.stopPropagation();
    nuevoElemento.remove(); // Eliminar el elemento
  });
}

export function crearLineaVertical() {
  let nuevaLinea = document.createElement('div');
  nuevaLinea.classList.add('linea', 'linea-vertical');

  let altura = Math.random() * 200 + 100;

  nuevaLinea.style.left = Math.random() * (window.innerWidth - 2) + 'px';
  nuevaLinea.style.top = Math.random() * (window.innerHeight - altura) + 'px';

  nuevaLinea.style.height = altura + 'px';

  document.body.appendChild(nuevaLinea);

  hacerArrastrable(nuevaLinea);
  agregarSeleccion(nuevaLinea);
  activarBotonesDeTamaño(nuevaLinea);
}

export function crearLineaHorizontal() {
  let nuevaLinea = document.createElement('div');
  nuevaLinea.classList.add('linea', 'linea-horizontal');

  let ancho = Math.random() * 200 + 100;

  nuevaLinea.style.left = Math.random() * (window.innerWidth - ancho) + 'px';
  nuevaLinea.style.top = Math.random() * (window.innerHeight - 2) + 'px';

  nuevaLinea.style.width = ancho + 'px';

  document.body.appendChild(nuevaLinea);

  hacerArrastrable(nuevaLinea);
  agregarSeleccion(nuevaLinea);
  activarBotonesDeTamaño(nuevaLinea);
}

export function activarBotonesDeTamaño(linea) {
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
