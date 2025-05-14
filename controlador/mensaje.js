// controlador.js


//--CARGAR LAS VARIALES DE ENTORNO--//
require('dotenv').config();


// taemos aixos
const axios = require('axios');


//IMPORTACION DE SDK para conectarse con OPEN AI
const { OpenAI } = require('openai');


//INCIALIZACION
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY //---llave key---//
});



//  Aquí se guardan los historiales por usuario
const historialesPorUsuario = {};


console.log("api2 " + process.env.API_KEY_NEWS_API)



//La funcion principal que recibe parametros del frontend
const mensajeFront = async (req, resp) => {
  

  const apiKey = process.env.API_KEY_GOOGLE;
  const cx = process.env.CX_GOOGLE;


  const mensajeChat = req.body.Mensaje;
  const usuarioId   = req.body.UsuarioId || 'anonimo'; // Usar algún identificador de usuario


  if (!mensajeChat) {
    return resp.status(400).json({ error: 'Mensaje vacío' });
  }


  // Si no existe historial para este usuario, lo creamos
  if (!historialesPorUsuario[usuarioId]) {
    historialesPorUsuario[usuarioId] = [

      //le decimos al sustema que tenga un rol de comportamiento
      {
        role: "system",
        content: "comportamiento normal de un chat GTP, y Responde en un máximo de 3 renglones. Sé claro y conciso."
      }
    ];
  }


  //contruccion del historial
  const message_history = historialesPorUsuario[usuarioId];



  // --- DETECTAR SI EL MENSAJE PIDE UNA IMAGEN ---
  try {

  
    if ( mensajeChat.toLowerCase().startsWith("imagen:") ) {
      const descripcion = mensajeChat.replace(/^imagen:|^dibuja:/i, "").trim();

      //console.log("mensaje" + descripcion)

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: descripcion,
        n: 1,
        size: "1024x1024" //  1024 × 1024 - 1024 × 1792 - 1792 × 1024 unos $0.04 a $0.08 USD por imagen.
      });


      
      const imageUrl = response.data[0].url;

       // Opcional: también puedes guardar este "evento" en el historial
       message_history.push({
        role: "user",
        content: `Solicitud de imagen: ${descripcion}`
      });

      
      message_history.push({
        role: "assistant",
        content: `Aquí está la imagen que pediste: ${imageUrl}`
      });

   

      return resp.status(200).json({
        tipo: "imagen",
        url: imageUrl,
        historial: message_history
      });

    }



    //-----------fujo de texto OPEN AI-------------//


    /*
        // nos conectamos al modelo gpt-4o-mini
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', 
          messages: message_history //envio el historial para la consulta
        });



        // respuesta del asistente del modelo de OPEN AI
        const respuestaAsistente = response.choices[0].message.content;

        //console.log("mensaje asistente:" + respuestaAsistente)



      
        // Agregar al asitente (osea la respuesta) al historial de conversacion
        message_history.push({
          role: "assistant",
          content: respuestaAsistente
        });




        //console.log(message_history)



        // ENVIO LA RESPUESTA AL FRONTEND
        resp.status(200).json({
          mensaje: response,
          tipo:"texto",
          soloMensaje: respuestaAsistente,
          historial: message_history
        });

    

*/




    //-------------FLUJO NORMAL DE TEXTO GOOGLE------------//
    if(mensajeChat.toLowerCase().startsWith("google:") ) {

          const tema = mensajeChat.replace(/^google:/i, "").trim();

       
          const respuesta = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: apiKey,
              cx: cx,
              q: tema,
              lr: 'lang_es', // solo español
              num: 2 // resultados a mostrar
            }
          });

        

          const resultados = respuesta.data.items.map((item) => ({
            titulo: item.title,
            descripcion: item.snippet,
            enlace: item.link
          }));

          console.log(resultados);
          
          return resp.status(200).json({
              resultado: resultados
          })
    }







    //-----FLUJO PARA BUSCAR IMAGEN-----//
    if(mensajeChat.toLowerCase().startsWith("google imagen:") ) {

          const tema = mensajeChat.replace(/^google imagen:/i, "").trim();

          const respuesta = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: apiKey,
              cx: cx,
              q: tema,
              searchType: 'image',
              lr: 'lang_es', // solo español
              num: 2 // resultados a mostrar
            }
          });

        

          const resultados = respuesta.data.items.map((item) => ({
            titulo: item.title,
            descripcion: item.snippet,
            enlace: item.link
          }));

          console.log(resultados);
          
          return resp.status(200).json({
              resultado: resultados
          })

    }

          /*
            return resp.status(200).json({
              tipo: "texto",
              soloMensaje: "No encontré noticias recientes sobre ese tema.",
              historial: message_history
            });
            */
        



           /*
          // Agrega la petición al historial
          message_history.push({
            role: "user",
            content: `Noticias recientes sobre: ${tema}`
          });


           // nos conectamos al modelo gpt-4o-mini
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                ...message_history,
                {
                  role: "system",
                  content: "Eres un asistente que resume noticias recientes. Sé claro, profesional y breve."
                },
                {
                  role: "user",
                  content: `Estas son las noticias:\n${resumen}\n\nHaz un resumen y comenta lo más importante.`
                }
              ]
          });

          const resumenFinal = response.choices[0].message.content;

        



        
          // Agregar al asitente (osea la respuesta) al historial de conversacion
          message_history.push({
            role: "assistant",
            content: resumenFinal
          });



          // ENVIO LA RESPUESTA AL FRONTEND
          resp.status(200).json({
            mensaje: response,
            tipo:"texto",
            soloMensaje: resumenFinal,
            historial: message_history
          });
          */

    


  } catch (error) {
    console.error(" Error en la API de OpenAI:", error);

    resp.status(500).json({
      errorMensaje: error.message,
      mensaje: "Ocurrió un error con OpenAI"
    });
  }
};



module.exports = {
  mensajeFront
};










































/*
//https://www.tutkit.com/es/tutoriales-de-texto/1315-implementacion-de-un-registro-de-chat-de-la-api-de-openai


const { OpenAI } = require('openai');

const mensajeFront = (req, resp) => {

  const mensajeChat = req.body.Mensaje;
  console.log(mensajeChat)

// Tu API key de OpenAI
const openai = new OpenAI({
  apiKey: '',
});


const messages = []
const system_prompt = "Eres un asistente con icreible sentido dle humor, que hace chistes de la temtica que te solicitan."


async function generarTexto() {

  //promp inicial
  messages.push({
    role: "system",
    content: system_prompt
  });

  //primera pregunta
  messages.push({
    role: 'user', 
    content: "un chiste de borrachos"
  })

  try {

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages
    });


    let respuestaAsistente = response.choices[0].message.content


    // Guardar la respuesta del asistente
    messages.push({
      role: 'assistant', 
      content: respuestaAsistente
    })


    // Hacer pregunta de seguimiento
    messages.push({
      role: 'user', 
      content: "explicamelo"
    })

    //Nuevea repsuesta
    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages
    });


    // guARDAR LA NUEVA RESPUESTA
      respuestaAsistente = response.choices[0].message.content

      messages.push({
        role: 'assistant', 
        content: respuestaAsistente
       
      })


    resp.status(200).json({
      mensaje: response,
      soloMensaje: respuestaAsistente,
      historial: messages
    })


  } catch (error) {

    //console.error('Error al hacer la solicitud:', error);

    resp.status(400).json({

        errorMensaje : error,
        mensaje : "No hay credito"
      } 
    )
    
  }
}


generarTexto();

}





module.exports = {

  mensajeFront

};



*/