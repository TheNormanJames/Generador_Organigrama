import {
  activarBotonesDeTamano,
  agregarSeleccion,
  hacerArrastrable,
  hacerRedimensionable,
} from '../../funciones_Carlos.js';
import {
  numCirculo,
  numParrafo,
  numTitulo,
  setNumCirculo,
  setNumParrafo,
  setNumTitulo,
} from '../../variables.js';
import { getDataNotaElTiempo } from '../getData.js';

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
    // let url = inputURL.value;
    console.log('Click en btnAceptarURL');
    insertarDataDeURL(nuevoElemento, inputURL, 'imagen');

    // if (url) {
    //   nuevoElemento.style.backgroundImage = `url(${url})`;
    //   nuevoElemento.textContent = ''; // Eliminar texto cuando se asigna la imagen
    // }
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
  activarBotonesDeTamano(nuevaLinea);
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
  activarBotonesDeTamano(nuevaLinea);
}

export function crearParrafoFunction(params) {
  setNumParrafo(numParrafo + 1);

  let nuevoParrafo = document.createElement('div');
  nuevoParrafo.classList.add('parrafo');
  nuevoParrafo.classList.add('parrafo_' + numParrafo);

  nuevoParrafo.contentEditable = true; // Permite editar el texto del párrafo
  nuevoParrafo.textContent = 'Escribe tu texto aquí...'; // Texto inicial

  nuevoParrafo.style.left = Math.random() * (window.innerWidth - 300) + 'px';
  nuevoParrafo.style.top = Math.random() * (window.innerHeight - 40) + 'px';

  document.body.appendChild(nuevoParrafo);

  hacerArrastrable(nuevoParrafo); // Hace que el párrafo sea arrastrable con el mouse
  hacerRedimensionable(nuevoParrafo); // Hace que el párrafo sea redimensionable

  // Crear el ícono de URL
  let iconoURL = document.createElement('i');
  iconoURL.classList.add('fas', 'fa-link', 'icono-url');
  nuevoParrafo.appendChild(iconoURL);

  // Crear el campo de entrada de URL
  let inputURLDiv = document.createElement('div');
  inputURLDiv.classList.add('input-url');

  inputURLDiv.classList.add('input-parrafo');

  let inputURL = document.createElement('input');
  inputURL.type = 'text';
  inputURL.placeholder = 'Introduce una URL';
  let btnAceptarURL = document.createElement('button');
  btnAceptarURL.textContent = 'Aceptar';

  inputURLDiv.appendChild(inputURL);
  inputURLDiv.appendChild(btnAceptarURL);
  nuevoParrafo.appendChild(inputURLDiv);

  // Mostrar el campo de URL cuando el icono sea clickeado
  iconoURL.addEventListener('click', function (e) {
    e.stopPropagation();
    inputURLDiv.style.display = 'flex'; // Mostrar el input
  });

  // Establecer la imagen de fondo cuando se acepta una URL
  btnAceptarURL.addEventListener('click', function () {
    insertarDataDeURL(nuevoParrafo, inputURL, 'parrafo');
    // let url = inputURL.value;
    // if (url) {
    //   nuevoParrafo.style.backgroundImage = `url(${url})`;
    //   nuevoParrafo.textContent = ''; // Eliminar texto cuando se asigna la imagen
    // }
    // inputURLDiv.style.display = 'none'; // Ocultar el input
  });
}

export function crearTituloFunction(params) {
  setNumTitulo(numTitulo + 1);

  let nuevoTitulo = document.createElement('div');
  nuevoTitulo.classList.add('titulo');
  nuevoTitulo.classList.add('Titulo_' + numTitulo);

  nuevoTitulo.contentEditable = true; // Permite editar el texto del título.
  nuevoTitulo.textContent = 'Título'; // Texto inicial del título

  nuevoTitulo.style.left = Math.random() * (window.innerWidth - 200) + 'px';
  nuevoTitulo.style.top = Math.random() * (window.innerHeight - 50) + 'px';

  document.body.appendChild(nuevoTitulo);

  hacerArrastrable(nuevoTitulo); // Hace que el título sea arrastrable con el mouse

  // Crear el ícono de URL
  let iconoURL = document.createElement('i');
  iconoURL.classList.add('fas', 'fa-link', 'icono-url');
  nuevoTitulo.appendChild(iconoURL);

  // Crear el campo de entrada de URL
  let inputURLDiv = document.createElement('div');
  inputURLDiv.classList.add('input-url');

  inputURLDiv.classList.add('input-titulo');

  let inputURL = document.createElement('input');
  inputURL.type = 'text';
  inputURL.placeholder = 'Introduce una URL';
  let btnAceptarURL = document.createElement('button');
  btnAceptarURL.textContent = 'Aceptar';

  inputURLDiv.appendChild(inputURL);
  inputURLDiv.appendChild(btnAceptarURL);
  nuevoTitulo.appendChild(inputURLDiv);

  // Mostrar el campo de URL cuando el icono sea clickeado
  iconoURL.addEventListener('click', function (e) {
    e.stopPropagation();
    inputURLDiv.style.display = 'flex'; // Mostrar el input
  });

  // Establecer la imagen de fondo cuando se acepta una URL
  btnAceptarURL.addEventListener('click', function () {
    insertarDataDeURL(nuevoTitulo, inputURL, 'titulo');

    // if (url) {
    //   nuevoTitulo.style.backgroundImage = `url(${url})`;
    //   nuevoTitulo.textContent = ''; // Eliminar texto cuando se asigna la imagen
    // }
    // inputURLDiv.style.display = 'none'; // Ocultar el input
  });
}

async function insertarDataDeURL(inputHTML, inputURL, tipoDeElemento) {
  console.log('Click en btnAceptarURL');
  let url = inputURL.value;
  let res = await getDataNotaElTiempo(url, tipoDeElemento);
  console.log(res);
  if (tipoDeElemento === 'imagen') {
    console.log(inputHTML);
    inputHTML.style.backgroundImage = `url(${res})`;

    // inputHTML.textContent = res;
  } else {
    inputHTML.textContent = res;
  }
}
