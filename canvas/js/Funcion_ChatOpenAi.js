    const chatForm    = document.getElementById('chatForm');
    const chatInput   = document.getElementById('chatInput');
    
    const chatWindow  = document.getElementById('chatWindow');
    const loadingDiv = document.querySelector(".base_contendor_loading");



    let Mensaje = ""
    let Mensaje1 = "";


    //------------Eventos para el motor de busqueda-------------//
    let logo_google = document.querySelector(".logo_google");
    let logo_AI     = document.querySelector(".logo_AI"); 

    let botones_google = document.querySelector('.base_botones_google')
    let botonesAI      =   document.querySelector(".base_botones_AI");

    let iconoVolver_M = document.querySelector(".icono_volver");

    // seleccionar motor google
    logo_google.addEventListener("click", () => {

        logo_AI.style.display = "none"; 
        botonesAI.style.display = "none"

        iconoVolver_M.style.display = "table";
        
        setTimeout( () => {
            botones_google.style.display = "table";
        }, 500)


        // logo en la cinta
        document.querySelector(".logo_google_informativo").src ="./img/google.png"

    })

    //seleccionar motor AI
    logo_AI.addEventListener('click', () => {

      logo_google.style.display = "none";
      botones_google.style.display = "none";



      iconoVolver_M.style.display = "table"

      setTimeout( () => {
        botonesAI.style.display = "table"
      }, 500)

      // logo en la cinta
      document.querySelector(".logo_google_informativo").src ="./img/openai2.png"

    })

    //icono volver a seleccionar 
    iconoVolver_M.addEventListener("click", () => {

        logo_AI.style.display = "block";
        logo_google.style.display = "block";

        botonesAI.style.display = "none"
        botones_google.style.display = "none";
        iconoVolver_M.style.display = "none";




        //---------resetiar todos los botones---------//
         num  = 1;
         num2 = 1;
         num3 = 1;
         num4 = 1;

         btnTextoGoogle.classList.remove("txt_google_seleccionado");
         btnImagenGoogle.classList.remove('image_google_seleccionado');
         btnTexto_AI.classList.remove('btn_open_AI_seleccionado');
         btnImagen_AI.classList.remove('btn_open_AI_seleccionado');

         document.querySelector(".input_mensaje").disabled = true;
         document.querySelector(".input_mensaje").style.backgroundColor = "#d4d4d4"
    })


    let btnTextoGoogle  = document.querySelector(".texto_google");
    let btnImagenGoogle = document.querySelector(".texto_imagen");

    let btnTexto_AI  = document.querySelector(".texto_AI");
    let btnImagen_AI = document.querySelector(".imagen_AI");
    

    //cerrar controaldores de google y open ai
    let iconoCerrarBusqueda = document.querySelector(".icono_cerrar_motor_busqueda");
    let contenedorCinta     = document.querySelector(".base_cinta_informativa");


    //Botones google
    let num  = 1;
    let num2 = 1;
    let num3 = 1;
    let num4 = 1;


    btnTextoGoogle.addEventListener("click", () => {


      //boton azul//
        btnImagenGoogle.classList.remove('image_google_seleccionado');
        num2 = 1;
      //boton azul//

      if(num == 1){


         Mensaje1 = "googletxt: "
         btnTextoGoogle.classList.add("txt_google_seleccionado");
         num = 0;
         document.querySelector(".input_mensaje").disabled = false;
         document.querySelector(".input_mensaje").style.backgroundColor = "#fff"

         iconoCerrarBusqueda.style.display = "table";
      
        }else{
          Mensaje1 = ""
          btnTextoGoogle.classList.remove("txt_google_seleccionado");
          num = 1;
          document.querySelector(".input_mensaje").disabled = true;
         document.querySelector(".input_mensaje").style.backgroundColor = "#d4d4d4"

         iconoCerrarBusqueda.style.display = "none";

      }
      
        document.querySelector(".textoModo").textContent = "Modo: busqueda de texto"

    })

    btnImagenGoogle.addEventListener("click", () => {
      
      //--boton rojo--//
      btnTextoGoogle.classList.remove("txt_google_seleccionado");
      num = 1;
      //--boton rojo--//

      if(num2 == 1){

        Mensaje1 = "googleimage: "
        btnImagenGoogle.classList.add('image_google_seleccionado');
        num2= 0;
        document.querySelector(".input_mensaje").disabled = false;
        document.querySelector(".input_mensaje").style.backgroundColor = "#fff"

        iconoCerrarBusqueda.style.display = "table";

      }else{
         Mensaje1 = ""
         btnImagenGoogle.classList.remove('image_google_seleccionado');
         num2= 1;
         document.querySelector(".input_mensaje").disabled = true;
         document.querySelector(".input_mensaje").style.backgroundColor = "#d4d4d4"

         iconoCerrarBusqueda.style.display = "none";
      }
      
      document.querySelector(".textoModo").textContent = "Modo: busqueda de imagen"
    })


    // Botones AI
    btnTexto_AI.addEventListener("click", () => {
       //boton imagen AI
        btnImagen_AI.classList.remove('btn_open_AI_seleccionado');
        document.querySelector(".input_mensaje").disabled = true;
         num4 = 1;
       //boton imagen AI


      if(num3 == 1){
        
        Mensaje1 = "textoai: "
        btnTexto_AI.classList.add('btn_open_AI_seleccionado');
        document.querySelector(".input_mensaje").disabled = false;
        document.querySelector(".input_mensaje").style.backgroundColor = "#fff"

        iconoCerrarBusqueda.style.display = "table";

        num3 = 0;
        
      }else{
        Mensaje1 = ""
        btnTexto_AI.classList.remove('btn_open_AI_seleccionado');
        document.querySelector(".input_mensaje").disabled = true;
        document.querySelector(".input_mensaje").style.backgroundColor = "#d4d4d4"
        num3 = 1;

        iconoCerrarBusqueda.style.display = "none";

      }
      
      document.querySelector(".textoModo").textContent = "Modo: busqueda de texto"
    })

    btnImagen_AI.addEventListener("click", () => {

        //boton texto AI
        document.querySelector(".input_mensaje").disabled = true;
        btnTexto_AI.classList.remove('btn_open_AI_seleccionado');
        num3 = 1;
        //boton texto AI



       if(num4 == 1){
        
        Mensaje1 = "imagenai: "
        btnImagen_AI.classList.add('btn_open_AI_seleccionado');
        document.querySelector(".input_mensaje").disabled = false;
        document.querySelector(".input_mensaje").style.backgroundColor = "#fff"
        num4 = 0;

        iconoCerrarBusqueda.style.display = "table";

       }else{

        Mensaje1 = ""
        btnImagen_AI.classList.remove('btn_open_AI_seleccionado');
        document.querySelector(".input_mensaje").disabled = true;
        document.querySelector(".input_mensaje").style.backgroundColor = "#d4d4d4"
        num4 = 1;

        iconoCerrarBusqueda.style.display = "none";


       }
      
       document.querySelector(".textoModo").textContent = "Modo: busqueda de imagen"
    })


  

    iconoCerrarBusqueda.addEventListener("click", () => {

      document.querySelector(".base_seleccion_motor").style.display   = "none";
      document.querySelector(".base_cinta_informativa").style.display = "table";

    })


    contenedorCinta.addEventListener("click", () => {

      contenedorCinta.style.display = "none";
      document.querySelector(".base_seleccion_motor").style.display   = "table";

    })

    //------------Fin eventos para el motor de busqueda-------------//



    // Quitar temporalmente el loading
    if (loadingDiv) {
        chatWindow.removeChild(loadingDiv);
    }

    chatForm.addEventListener('submit', async function(e) {

      e.preventDefault();


      Mensaje = Mensaje1 + chatInput.value.trim();
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

          const respuesta = await fetch('https://back-gpt-pybo.onrender.com/chat', {
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
          console.log(` Tiempo de respuesta del servidor: ${tiempoRespuesta.toFixed(2)} ms`);


          if (!respuesta.ok) {
            throw new Error('Error en la petición: ' + respuesta.statusText);
          }

          //----RESPUESTA OPEN AI---//
          data = await respuesta.json();
          //console.log(data)

         
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


      // GOOGLE

      

      // APLICA PARA OPEN AI
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
         if (mensaje.toLowerCase().startsWith("imagenai:")) {
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


            //GOOGLE
            if(data.tipo == "imagenGoogle"){

              

                let divImagen     = document.createElement('div');
                let imagenData    = document.createElement('img');
                let botonDescarga = document.createElement('p')
                
                divImagen.classList.add('div_imagen');
                imagenData.classList.add('imagen_GTP');
                botonDescarga.classList.add('boton_descarga');


                chatWindow.appendChild(divImagen);
                divImagen.appendChild(imagenData)
                divImagen.appendChild(botonDescarga)
                botonDescarga.textContent = "Abrir para descargar imagen"

                imagenData.src = data.resultado[0].enlace



                // abrir imagen en una nueva pestaña
                botonDescarga.addEventListener("click", function(){

                  window.open(data.resultado[0].enlace)

                })

              
            }


            if(data.tipo == "txtGoogle"){

                 const lineaDeMensaje = document.createElement('div');
                 const titulo = document.createElement('h2'); // Creamos el h2
                 const parrafoNuevo  = document.createElement('p');
                 const parrafoNuevo2 = document.createElement('p');
                 const etiquetaA1 = document.createElement('a')
                 const etiquetaA2 = document.createElement('a')
                 const crearHR = document.createElement('hr');

                 const respuesta1 = document.createElement('h3');
                 const respuesta2 = document.createElement('h3');


                 lineaDeMensaje.classList.add('Mensaje');
                 lineaDeMensaje.classList.add('user2');
                 crearHR.classList.add('linea_divisora')

                  titulo.textContent = "Asistente EL TIEMPO"; // Texto del h2
                  parrafoNuevo.textContent  = data.resultado[0].descripcion;
                  parrafoNuevo2.textContent = data.resultado[1].descripcion;
                  respuesta1.textContent  = "Respuesta 1"
                  respuesta2.textContent  = "Respuesta 2"
                  respuesta1.classList.add('tituloRespusta')
                  respuesta2.classList.add('tituloRespusta')






                  etiquetaA1.href = data.resultado[0].enlace;
                  etiquetaA2.href = data.resultado[1].enlace;
                  etiquetaA1.textContent = data.resultado[0].enlace;
                  etiquetaA2.textContent = data.resultado[1].enlace;

                  etiquetaA1.setAttribute('target', 'blank');
                  etiquetaA2.setAttribute('target', 'blank');




                  // Agregamos primero el h2, luego el p
                  lineaDeMensaje.appendChild(titulo);
                  lineaDeMensaje.appendChild(respuesta1);
                  lineaDeMensaje.appendChild(parrafoNuevo);
                  lineaDeMensaje.appendChild(etiquetaA1);

                  lineaDeMensaje.appendChild(crearHR)

                  lineaDeMensaje.appendChild(respuesta2);
                  lineaDeMensaje.appendChild(parrafoNuevo2);
                  lineaDeMensaje.appendChild(etiquetaA2);



                  chatWindow.appendChild(lineaDeMensaje);
                  chatWindow.scrollTop = chatWindow.scrollHeight;

            }
    
      }
      
    }



    //--------------Abrir chat-----------//

    let  botonChat     =  document.querySelector(".icono_chat")
    let  ventanaChat   =  document.querySelector(".chat-container");

    let contenedorMotoresBusqueda = document.querySelector(".base_seleccion_motor");


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



    


