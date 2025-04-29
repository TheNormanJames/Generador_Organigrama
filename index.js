
const express  = require('express');
const cors     = require('cors');

const axios = require('axios');


//---inicializamos express---//
const usarExpress = express();


//----------configuracion de datos-------------//
//usarExpress.use( cors() );

app.use(cors({
  origin: 'https://www.eltiempo.com', // o '*' para todos los orígenes (no recomendado en producción)
}));

app.post('/chat', (req, res) => {
  res.json({ message: 'CORS habilitado correctamente' });
});

usarExpress.use( express.json() );
usarExpress.use( express.urlencoded( { extended:true }  ))




//---creamos servidor----//
  usarExpress.listen(3000, (req, resp) => {

    console.log(`Servidor escuchando en http://localhost:3000`);
    
  });


  //---importamos rutas---//
  const rutaMensaje = require("./rutas/rutaMensaje");
  usarExpress.use(rutaMensaje)


