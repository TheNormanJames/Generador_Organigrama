
const express  = require('express');
const cors     = require('cors');

const axios = require('axios');


//---inicializamos express---//
const usarExpress = express();


//----------configuracion de datos-------------//
usarExpress.use( cors() );
usarExpress.use( express.json() );
usarExpress.use( express.urlencoded( { extended:true }  ))




//---creamos servidor----//
  usarExpress.listen(3000, (req, resp) => {

    //console.log(`Servidor escuchando en http://localhost:3000`);
    console.log("Conectar al servidor por render");

  });




  //---importamos rutas---//
  const rutaMensaje = require("./rutas/rutaMensaje");
  usarExpress.use(rutaMensaje)


