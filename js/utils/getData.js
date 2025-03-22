// let urlNotaElTiempo = 'https://www.eltiempo.com/unidad-investigativa/el-chalet-en-colombia-que-negocio-exministro-del-presidente-pedro-sanchez-indagado-por-corrupcion-3437412'

import { urlNotaElTiempo } from '../variables.js';

export async function getDataNotaElTiempo(
  urlNotaElTiempoProps,
  tipoDeElemento
) {
  // console.log(urlNotaElTiempoProps, tipoDeElemento);
  const tiposDeElementos = {
    titulo: 'titulo',
    parrafo: 'parrafo',
  };

  let respuesta = await fetch(urlNotaElTiempoProps ?? urlNotaElTiempo);

  let data = await respuesta.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');

  let respuestaEnTexto;

  if (tiposDeElementos[tipoDeElemento] === 'titulo') {
    respuestaEnTexto = doc.querySelector('.c-articulo__titulo').textContent;
  }
  if (tiposDeElementos[tipoDeElemento] === 'parrafo') {
    respuestaEnTexto = doc.querySelector('[name="description"]').content;
  }
  return new Promise((resolve) => {
    resolve(respuestaEnTexto);
  });

  // let resParrafo = doc.querySelectorAll('.paragraph');

  // resParrafo.forEach((resp) => {
  //   console.log(resp.textContent);

  //document.getElementById("parrafo").appendChild(resp.textContent)
  // });

  // Seleccionamos solo el contenido relevante (en este caso, el artículo)
  // const contenido = doc.querySelector('div.article-body'); // Suponiendo que el artículo está en un div con clase "article-body"

  // Extraemos el texto y lo mostramos
  // const texto = contenido
  //   ? contenido.innerText
  //   : 'No se pudo extraer el contenido';
  // document.getElementById('resultado').innerText = texto;
  //   })
  //   .catch((error) => console.error('Error:', error));
}
