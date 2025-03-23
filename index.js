import {
  crearLineaHorizontal,
  crearLineaVertical,
  crearNuevoElemento,
  crearParrafoFunction,
  crearTituloFunction,
} from './js/utils/crearDOM/crearDOM.js';
import { clickPorFuera } from './js/utils/interactiveDOM/interactiveDOM.js';
import { lineaSeleccionada } from './js/variables.js';

document.addEventListener('click', (e) => {
  if (e.target.matches('#crearElemento')) {
    crearNuevoElemento();
  }
  if (e.target.matches('#crearLineaVertical')) {
    crearLineaVertical();
  }
  if (e.target.matches('#crearLineaHorizontal')) {
    crearLineaHorizontal();
  }
  if (e.target.matches('#crearTitulo')) {
    crearTituloFunction();
  }
  if (e.target.matches('#crearParrafo')) {
    crearParrafoFunction();
  }
  clickPorFuera(e);
});
document.addEventListener('DOMContentLoaded', (e) => {
  document
    .getElementById('cargarImagen')
    .addEventListener('change', function (event) {
      if (event.target.files.length > 0) {
        const archivo = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          if (
            lineaSeleccionada &&
            lineaSeleccionada.classList.contains('movible')
          ) {
            // Solo establecer la imagen de fondo sin borrar el contenido
            lineaSeleccionada.style.backgroundImage = `url(${e.target.result})`;
          }
        };

        reader.readAsDataURL(archivo);
      }
    });
});
