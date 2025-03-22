//*------------------------------------------------*/
//#region //* Variables

// DOM

// Project
export let numCirculo = 0;
export let lineaSeleccionada = null;
export let numParrafo = 0;
export let numTitulo = 0;

// Extras
export const urlNotaElTiempo =
  'http://127.0.0.1:5500/miniFigma/notaElTiempo.html';

//#endregion //! Variables

//*------------------------------------------------*/
//#region //* setVariables

export function setNumCirculo(params) {
  numCirculo = params;
}
export function setLineaSeleccionada(params) {
  lineaSeleccionada = params;
}
export function setNumParrafo(params) {
  numParrafo = params;
}
export function setNumTitulo(params) {
  numTitulo = params;
}

//#endregion //! setVariables
