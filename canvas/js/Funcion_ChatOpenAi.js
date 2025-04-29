    const chatForm    = document.getElementById('chatForm');
    const chatInput   = document.getElementById('chatInput');
    
    const chatWindow  = document.getElementById('chatWindow');
    const loadingDiv = document.querySelector(".base_contendor_loading");


    // Quitar temporalmente el loading
    if (loadingDiv) {
        chatWindow.removeChild(loadingDiv);
    }

    chatForm.addEventListener('submit', async function(e) {

      e.preventDefault();


    

      const Mensaje = chatInput.value.trim();
      console.log(Mensaje)

      

      let tiempoRespuesta;
      let respuestaOpenAi;

      let data;

      if (Mensaje !== '') {

        //enviamos el mensaje 
        appendMensaje(Mensaje, 'usuario', []);

        // limpiar input
        chatInput.value = ''; 

        
        
        //Enviar Mensaje al Backend
         try {

          const inicio = performance.now(); // Tiempo justo antes del fetch

          const respuesta = await fetch('https://back-gpt.onrender.com/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
            Mensaje,
            UsuarioID : "carlos1234"
             }) // Enviamos el mensaje como JSON
          });

          
          const fin = performance.now(); // Tiempo justo después de la respuesta
          tiempoRespuesta = fin - inicio;
          console.log(`⏱️ Tiempo de respuesta del servidor: ${tiempoRespuesta.toFixed(2)} ms`);


          if (!respuesta.ok) {
            throw new Error('Error en la petición: ' + respuesta.statusText);
          }

          //----RESPUESTA OPEN AI---//
          data = await respuesta.json();
          console.log(data)

         
         /* if(data.tipo == "texto"){

             console.log('Respuesta del servidor:', data.mensaje.choices[0].message.content );
             respuestaOpenAi = data.mensaje.choices[0].message.content;
          
          }else if( data.tipo == "imagen" ){

             console.log('Respuesta del servidor:', data.url );
             respuestaOpenAi = data.imagen;

          }
          */


         

        } catch (error) {

          console.error('Error al enviar el mensaje:', error);
        }
  


        //----Respuesta del servidor----//

         setTimeout(() => {
            appendMensaje( respuestaOpenAi, 'boot', data);
          }, tiempoRespuesta);
        
        
        
      }
      

    });


    
   function appendMensaje(mensaje, sender, data) {

      console.log(mensaje)
      console.log(sender)
      console.log(data)


      const contenedor = document.getElementById("contenedor-mensajes");

      


      if (sender === 'usuario') {
        
        const lineaDeMensaje = document.createElement('div');
        const titulo = document.createElement('h2'); // Creamos el h2
        const parrafoNuevo = document.createElement('p');
        lineaDeMensaje.classList.add('Mensaje');


        lineaDeMensaje.classList.add('user');

        titulo.textContent = "Tu"; // Texto del h2
        parrafoNuevo.textContent = mensaje;

        // Agregamos primero el h2, luego el p
        lineaDeMensaje.appendChild(titulo);
        lineaDeMensaje.appendChild(parrafoNuevo);

        chatWindow.appendChild(lineaDeMensaje);
        chatWindow.scrollTop = chatWindow.scrollHeight;



         // Volver a agregar el loading al final
         if (mensaje.toLowerCase().startsWith("imagen:")) {
          if (loadingDiv) {
            chatWindow.appendChild(loadingDiv);
          }
        }
       


      }




      if (sender === 'boot'){ 


      
            if(data.tipo == "texto"){

                 const lineaDeMensaje = document.createElement('div');
                 const titulo = document.createElement('h2'); // Creamos el h2
                 const parrafoNuevo = document.createElement('p');
                 lineaDeMensaje.classList.add('Mensaje');


                 lineaDeMensaje.classList.add('user2');

                  titulo.textContent = "Asistente EL TIEMPO"; // Texto del h2
                  parrafoNuevo.textContent = data.soloMensaje;

                  // Agregamos primero el h2, luego el p
                  lineaDeMensaje.appendChild(titulo);
                  lineaDeMensaje.appendChild(parrafoNuevo);

                  chatWindow.appendChild(lineaDeMensaje);
                  chatWindow.scrollTop = chatWindow.scrollHeight;
            }

            if( data.tipo == "imagen" ){
              
   
              // Volver a agregar el loading al final
              if (loadingDiv) {
                chatWindow.removeChild(loadingDiv);
              }



                let divImagen  = document.createElement('div');
                let imagenData = document.createElement('img');
                let botonDescarga = document.createElement('p')
                
                divImagen.classList.add('div_imagen');
                imagenData.classList.add('imagen_GTP');
                botonDescarga.classList.add('boton_descarga');


                chatWindow.appendChild(divImagen);
                divImagen.appendChild(imagenData)
                divImagen.appendChild(botonDescarga)
                botonDescarga.textContent = "Abrir para descargar imagen"

                imagenData.src = data.url



                // abrir imagen en una nueva pestaña
                botonDescarga.addEventListener("click", function(){

                  window.open(data.url)

                })

            }
    
        }
      
    }



    //--------------Abrir chat-----------//

    let  botonChat     =  document.querySelector(".icono_chat")
    let  ventanaChat   =  document.querySelector(".chat-container");

    botonChat.addEventListener("click", function(){

      ventanaChat.style.display = "block"; 
      botonChat.style.display = "none";



    });


    //----cerrar chat-----//
    let botonCerrar = document.querySelector(".icono_cerrar");

    botonCerrar.addEventListener("click", function(){

      ventanaChat.style.display = "none"; 
      botonChat.style.display = "block";

    })