export function clickPorFuera(event) {
  // Verificar si el clic se realizó fuera de cualquier elemento con la clase .movible o .linea
  let clickedInside = false;
  let elementoSeleccionado = document.querySelector('.seleccionado');

  // Comprobar si el clic fue dentro de un elemento con la clase .movible o .linea
  if (
    elementoSeleccionado &&
    (elementoSeleccionado.contains(event.target) ||
      event.target.classList.contains('movible') ||
      event.target.classList.contains('linea'))
  ) {
    clickedInside = true;
  }

  if (!clickedInside) {
    // Si el clic fue fuera, quitar la clase .seleccionado
    if (elementoSeleccionado) {
      elementoSeleccionado.classList.remove('seleccionado');
      // Ocultar los iconos
      let iconos = elementoSeleccionado.querySelectorAll(
        '.icono-subir-imagen, .icono-url, .icono-borrar'
      );
      iconos.forEach(function (icono) {
        icono.style.display = 'none';
      });
    }
  }
}
