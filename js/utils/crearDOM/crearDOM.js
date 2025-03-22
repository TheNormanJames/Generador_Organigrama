import {
  hacerArrastrable,
  hacerRedimensionable,
} from '../../funciones_Carlos.js';
import {
  numParrafo,
  numTitulo,
  setNumParrafo,
  setNumTitulo,
} from '../../variables.js';
import { getDataNotaElTiempo } from '../getData.js';

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
    let url = inputURL.value;
    if (url) {
      nuevoParrafo.style.backgroundImage = `url(${url})`;
      nuevoParrafo.textContent = ''; // Eliminar texto cuando se asigna la imagen
    }
    inputURLDiv.style.display = 'none'; // Ocultar el input
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
  btnAceptarURL.addEventListener('click', async function () {
    console.log('Click en btnAceptarURL');
    let url = inputURL.value;
    console.log(url);
    console.log(typeof url);

    let res;

    res = await getDataNotaElTiempo(url, 'titulo');
    console.log(res);
    nuevoTitulo.textContent = res;

    // if (url) {
    //   nuevoTitulo.style.backgroundImage = `url(${url})`;
    //   nuevoTitulo.textContent = ''; // Eliminar texto cuando se asigna la imagen
    // }
    // inputURLDiv.style.display = 'none'; // Ocultar el input
  });
}
