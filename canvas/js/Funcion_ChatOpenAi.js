const chatForm    = document.getElementById('chatForm');
    const chatInput   = document.getElementById('chatInput');
    const chatWindow  = document.getElementById('chatWindow');


    chatForm.addEventListener('submit', async function(e) {

      e.preventDefault();

      const Mensaje = chatInput.value.trim();
      console.log(Mensaje)

      

      let tiempoRespuesta;
      let respuestaOpenAi;

      if (Mensaje !== '') {

        //enviamos el mensaje 
        appendMensaje(Mensaje, 'usuario');

        // limpiar input
        chatInput.value = ''; 

        
        
        //Enviar Mensaje al Backend
         try {

          const inicio = performance.now(); // Tiempo justo antes del fetch

          const respuesta = await fetch('http://localhost:3000/chat', {
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
          const data = await respuesta.json();
          console.log(data)
          console.log('Respuesta del servidor:', data.mensaje.choices[0].message.content );
          respuestaOpenAi = data.mensaje.choices[0].message.content;





        } catch (error) {

          console.error('Error al enviar el mensaje:', error);
        }
  


        //----Respuesta del servidor----//
         setTimeout(() => {
            appendMensaje( respuestaOpenAi, 'boot');
          }, tiempoRespuesta);
        
        
        
      }
      

    });


    
   function appendMensaje(mensaje, sender) {
      const contenedor = document.getElementById("contenedor-mensajes");

      const lineaDeMensaje = document.createElement('div');
      const titulo = document.createElement('h2'); // Creamos el h2
      const parrafoNuevo = document.createElement('p');

      lineaDeMensaje.classList.add('Mensaje');

      if (sender === 'usuario') {
        
        lineaDeMensaje.classList.add('user');

        titulo.textContent = "Tu"; // Texto del h2
        parrafoNuevo.textContent = mensaje;

        // Agregamos primero el h2, luego el p
        lineaDeMensaje.appendChild(titulo);
        lineaDeMensaje.appendChild(parrafoNuevo);

        chatWindow.appendChild(lineaDeMensaje);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }



      if (sender === 'boot'){ 

         
        lineaDeMensaje.classList.add('user2');

        titulo.textContent = "Asistente EL TIEMPO"; // Texto del h2
        parrafoNuevo.textContent = mensaje;

        // Agregamos primero el h2, luego el p
        lineaDeMensaje.appendChild(titulo);
        lineaDeMensaje.appendChild(parrafoNuevo);

        chatWindow.appendChild(lineaDeMensaje);
        chatWindow.scrollTop = chatWindow.scrollHeight;
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