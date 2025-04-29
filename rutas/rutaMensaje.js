

/*---importamos express---*/
const express = require('express');
const usarRuta = express.Router();


//---importamos controladores---//
const controlador = require("../controlador/mensaje")


//----crear ruta
usarRuta.post('/chat', controlador.mensajeFront )


//exportamos el router
module.exports = usarRuta