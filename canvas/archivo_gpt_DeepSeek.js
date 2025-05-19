// MiniFigma Optimizado - Versión Consolidada

class MiniFigma {
  constructor() {
    this.canvas = document.getElementById("miCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.setupCanvas();

    this.state = {
      objetos: [],
      objetosSeleccionados: [],
      objetoEditando: null,
      conectandoFlecha: false,
      puntoInicioFlecha: null,
      arrastrando: false,
      gridSize: 20,
      textoRedimensionando: null,
      zoom: 1,
      offsetCanvas: { x: 0, y: 0 },
      desplazandoCanvas: false,
      ultimaPosMouse: { x: 0, y: 0 },
      modoPanActivo: false,
      minRadioCirculo: 20,
      maxRadioCirculo: 60,
      circuloRedimensionando: null,
      historial: [],
      indiceHistorial: -1,
      offsets: new Map(),
      mostrarLimiteExportacion: false,
      anchoLimiteExportacion: 648,
    };

    this.initUIElements();
    this.setupEventListeners();
    this.dibujar();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 65;

    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight - 65;
      this.dibujar();
    });
  }

  initUIElements() {
    // Editor de texto
    this.editorTexto = document.createElement("textarea");
    Object.assign(this.editorTexto.style, {
      position: "absolute",
      display: "none",
      fontFamily: "Inter, sans-serif",
      fontSize: "16px",
      border: "1px solid #d1d5db",
      padding: "6px 8px",
      zIndex: "1000",
      resize: "none",
      outline: "none",
      backgroundColor: "white",
      borderRadius: "6px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      minHeight: "40px",
      lineHeight: "1.5",
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
    });
    this.editorTexto.addEventListener("input", () =>
      this.autosizeTextarea(this.editorTexto)
    );
    document.body.appendChild(this.editorTexto);

    // Popup para imágenes
    this.popup = document.createElement("div");
    this.popup.style.position = "absolute";
    this.popup.style.padding = "10px";
    this.popup.style.background = "white";
    this.popup.style.border = "1px solid black";
    this.popup.style.display = "none";
    this.popup.innerHTML = `
      <input type="text" placeholder="URL de imagen" id="imgUrl" style="display:block; margin-bottom:5px; width: 200px;"/>
      <input type="file" id="imgFile" accept="image/*"/>
    `;
    document.body.appendChild(this.popup);

    // Botones de la interfaz
    document.getElementById("circleBtn").onclick = () => this.crear("circulo");
    document.getElementById("btnTituloSumario").onclick = () =>
      this.crear("tituloSumario");
    document.getElementById("btnTituloCargo").onclick = () =>
      this.crear("tituloCargo");
    document.getElementById("circleFlecha").onclick = () =>
      this.crear("flechaConectada");
    document.getElementById("btnFrente").onclick = () => this.moverZ("frente");
    document.getElementById("btnFondo").onclick = () => this.moverZ("fondo");
    document.getElementById("btnExportar").onclick = () => this.exportarJSON();
    document.getElementById("btnImportar").onchange = (e) =>
      this.importarJSON(e);
    document.getElementById("btnExportarImagen").onclick = () =>
      this.exportarImagen();
    document.getElementById("btnToggleLimite").onclick = () =>
      this.toggleLimiteExportacion();
  }

  setupEventListeners() {
    // Eventos del canvas
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("dblclick", (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e), {
      passive: false,
    });

    // Eventos del teclado
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  toggleLimiteExportacion() {
    this.state.mostrarLimiteExportacion = !this.state.mostrarLimiteExportacion;
    this.dibujar();
  }

  // Métodos de dibujo y renderizado
  dibujar() {
    const { ctx, canvas, state } = this;
    const {
      zoom,
      offsetCanvas,
      mostrarLimiteExportacion,
      anchoLimiteExportacion,
    } = state;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(zoom, 0, 0, zoom, offsetCanvas.x, offsetCanvas.y);

    // Dibujar límite de exportación si está activo
    if (mostrarLimiteExportacion) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2 / zoom; // Ajustar grosor según el zoom
      ctx.setLineDash([5 / zoom, 5 / zoom]); // Ajustar patrón de guiones según el zoom
      ctx.strokeRect(0, 0, anchoLimiteExportacion, canvas.height / zoom);
      ctx.setLineDash([]);
    }

    // Dibujar flechas primero para que queden detrás
    state.objetos
      .filter((obj) => obj instanceof Flecha)
      .forEach((obj) => obj.dibujar(ctx));

    // Dibujar otros objetos
    state.objetos
      .filter((obj) => !(obj instanceof Flecha))
      .forEach((obj) => obj.dibujar(ctx));
  }

  exportarImagen() {
    const { anchoLimiteExportacion } = this.state;
    const objetosDentroLimite = this.getObjetosDentroLimite();

    // Crear un canvas temporal para la exportación
    const canvasTemp = document.createElement("canvas");
    const ctxTemp = canvasTemp.getContext("2d");

    // Calcular dimensiones necesarias
    const { minY, maxY } =
      this.calcularDimensionesExportacion(objetosDentroLimite);
    const altoExportacion = maxY - minY + 40; // +40 para margen

    // Configurar canvas temporal
    canvasTemp.width = anchoLimiteExportacion;
    canvasTemp.height = altoExportacion;
    ctxTemp.fillStyle = "white";
    ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);

    // Dibujar objetos en el canvas temporal (ajustando coordenadas)
    objetosDentroLimite.forEach((obj) => {
      ctxTemp.save();

      // Ajustar posición para que todo quede dentro del canvas
      if (
        obj instanceof ComponenteTexto ||
        obj instanceof ComponenteTituloSumario ||
        obj instanceof ComponenteTituloCargo
      ) {
        // Para componentes complejos, mover todos sus hijos
        obj.hijos.forEach((hijo) => {
          const x = hijo.x;
          const y = hijo.y - minY + 20; // Ajustar Y con margen
          this.dibujarObjetoEnContexto(ctxTemp, hijo, x, y);
        });
      } else {
        // Para objetos simples
        const x = obj.x;
        const y = obj.y - minY + 20; // Ajustar Y con margen
        this.dibujarObjetoEnContexto(ctxTemp, obj, x, y);
      }

      ctxTemp.restore();
    });

    // Crear enlace de descarga
    const enlace = document.createElement("a");
    enlace.href = canvasTemp.toDataURL("image/png");
    enlace.download = "diseño_exportado.png";
    enlace.click();
  }

  // Métodos auxiliares para la exportación de imagen
  getObjetosDentroLimite() {
    const { anchoLimiteExportacion } = this.state;
    return this.state.objetos.filter((obj) => {
      if (obj instanceof Flecha) {
        // Para flechas, verificar si ambos extremos están dentro del límite
        const origenX = obj.origen.x + (obj.origen.radio || 0);
        const destinoX = obj.destino.x - (obj.destino.radio || 0);
        return (
          origenX <= anchoLimiteExportacion &&
          destinoX <= anchoLimiteExportacion
        );
      } else if (
        obj instanceof ComponenteTexto ||
        obj instanceof ComponenteTituloSumario ||
        obj instanceof ComponenteTituloCargo
      ) {
        // Para componentes, verificar si su ancho está dentro del límite
        return obj.x + obj.ancho <= anchoLimiteExportacion;
      } else if (obj instanceof Circulo) {
        return obj.x + obj.radio <= anchoLimiteExportacion;
      } else if (obj instanceof Texto) {
        return obj.x + obj.ancho <= anchoLimiteExportacion;
      }
      return true;
    });
  }

  calcularDimensionesExportacion(objetos) {
    let minY = Infinity;
    let maxY = -Infinity;

    objetos.forEach((obj) => {
      if (
        obj instanceof ComponenteTexto ||
        obj instanceof ComponenteTituloSumario ||
        obj instanceof ComponenteTituloCargo
      ) {
        // Para componentes, verificar todos sus hijos
        obj.hijos.forEach((hijo) => {
          minY = Math.min(minY, hijo.y - hijo.fontSize);
          maxY = Math.max(maxY, hijo.y + hijo.fontSize);
        });
      } else if (obj instanceof Circulo) {
        minY = Math.min(minY, obj.y - obj.radio);
        maxY = Math.max(maxY, obj.y + obj.radio);
      } else if (obj instanceof Texto) {
        minY = Math.min(minY, obj.y - obj.fontSize);
        maxY = Math.max(
          maxY,
          obj.y + obj.fontSize * (obj.texto.split("\n").length || 1)
        );
      }
    });

    return { minY: Math.max(0, minY - 20), maxY: maxY + 20 }; // Agregar márgenes
  }

  dibujarObjetoEnContexto(ctx, obj, x, y) {
    // Guardar posición original
    const originalX = obj.x;
    const originalY = obj.y;

    // Asignar posición temporal para el dibujo
    obj.x = x;
    obj.y = y;

    // Dibujar el objeto
    obj.dibujar(ctx);

    // Restaurar posición original
    obj.x = originalX;
    obj.y = originalY;
  }

  // Métodos de creación de objetos
  crear(tipo) {
    const { objetos } = this.state;

    switch (tipo) {
      case "circulo":
        objetos.push(new Circulo(100, 100, 30, "blue"));
        break;
      case "texto":
        objetos.push(new Texto(150, 150, "Hola!", 18));
        break;
      case "tituloSumario":
        objetos.push(new ComponenteTituloSumario(150, 150));
        break;
      case "tituloCargo":
        objetos.push(new ComponenteTituloCargo(150, 150));
        break;
      case "flechaConectada":
        this.state.conectandoFlecha = true;
        break;
    }

    this.guardarHistorial();
    this.dibujar();
  }

  crearTextoPersonalizado(
    texto,
    fontSize,
    color,
    alineacion = "left",
    ancho = 300
  ) {
    const nuevoTexto = new Texto(150, 150, texto, fontSize, color, ancho);
    nuevoTexto.alineacion = alineacion;
    this.state.objetos.push(nuevoTexto);
    this.dibujar();
  }

  // Métodos de manejo de eventos
  handleMouseDown(e) {
    const { offsetX, offsetY, shiftKey } = e;
    const { x, y } = this.transformarCoordenadas(offsetX, offsetY);
    const state = this.state;

    this.actualizarCursor(x, y);
    state.arrastrando = true;
    state.textoRedimensionando = null;
    state.circuloRedimensionando = null;

    // Verificar handlers de redimensionamiento
    for (const obj of state.objetos) {
      if (obj instanceof Circulo && obj.estaSobreHandler(x, y)) {
        state.circuloRedimensionando = obj;
        return;
      }
      if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
        state.textoRedimensionando = obj;
        return;
      }
    }

    state.objetosSeleccionados = [];

    // Selección de objetos
    for (const obj of state.objetos) {
      if (obj.contienePunto(x, y)) {
        if (shiftKey) {
          if (!state.objetosSeleccionados.includes(obj)) {
            state.objetosSeleccionados.push(obj);
            obj.seleccionado = true;
          }
        } else {
          state.objetos.forEach((o) => (o.seleccionado = false));
          state.objetosSeleccionados = [obj];
          obj.seleccionado = true;
        }

        // Para ComponenteTexto, guardar offset del punto de click
        if (obj instanceof ComponenteTexto) {
          state.offsets.set(obj, { dx: x - obj.x, dy: y - obj.y });
        } else {
          state.offsets.set(obj, { dx: x - obj.x, dy: y - obj.y });
        }
      }
    }

    // Conexión de flechas
    if (state.conectandoFlecha && state.objetosSeleccionados.length === 1) {
      if (!state.puntoInicioFlecha) {
        state.puntoInicioFlecha = state.objetosSeleccionados[0];
      } else {
        const flecha = new Flecha(
          state.puntoInicioFlecha,
          state.objetosSeleccionados[0]
        );
        state.objetos.unshift(flecha);
        state.conectandoFlecha = false;
        state.puntoInicioFlecha = null;
      }
    }

    // Modo pan
    if (state.modoPanActivo) {
      state.desplazandoCanvas = true;
      state.ultimaPosMouse = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = "grabbing";
    }

    this.guardarHistorial();
    this.dibujar();
  }

  handleMouseMove(e) {
    const { offsetX, offsetY } = e;
    const { x, y } = this.transformarCoordenadas(offsetX, offsetY);
    const state = this.state;

    this.actualizarCursor(x, y);

    // Redimensionamiento de objetos
    if (state.arrastrando && state.circuloRedimensionando) {
      const nuevoRadio = Math.max(
        10,
        Math.hypot(
          x - state.circuloRedimensionando.x,
          y - state.circuloRedimensionando.y
        ) - 5
      );
      state.circuloRedimensionando.radio = Math.max(
        Math.min(nuevoRadio, state.maxRadioCirculo),
        state.minRadioCirculo
      );
      this.dibujar();
      return;
    }

    if (state.arrastrando && state.textoRedimensionando) {
      const nuevoAncho = Math.max(30, x - state.textoRedimensionando.x);
      state.textoRedimensionando.ancho = nuevoAncho;
      this.dibujar();
      return;
    }

    // Desplazamiento del canvas
    if (state.desplazandoCanvas) {
      const dx = e.clientX - state.ultimaPosMouse.x;
      const dy = e.clientY - state.ultimaPosMouse.y;
      state.offsetCanvas.x += dx;
      state.offsetCanvas.y += dy;
      state.ultimaPosMouse = { x: e.clientX, y: e.clientY };
      this.dibujar();
      return;
    }

    // Movimiento de objetos
    if (state.arrastrando) {
      state.objetosSeleccionados.forEach((obj) => {
        const o = state.offsets.get(obj);
        if (o) {
          if (
            obj instanceof ComponenteTexto ||
            obj instanceof ComponenteTituloSumario ||
            obj instanceof ComponenteTituloCargo
          ) {
            // Mover todo el componente
            const newX =
              Math.round((x - o.dx) / state.gridSize) * state.gridSize;
            const newY =
              Math.round((y - o.dy) / state.gridSize) * state.gridSize;
            const dx = newX - obj.x;
            const dy = newY - obj.y;
            obj.mover(dx, dy);
          } else {
            obj.x = Math.round((x - o.dx) / state.gridSize) * state.gridSize;
            obj.y = Math.round((y - o.dy) / state.gridSize) * state.gridSize;
          }
        }
      });
      this.dibujar();
    }
  }

  handleMouseUp(e) {
    const { offsetX, offsetY } = e;
    const { x, y } = this.transformarCoordenadas(offsetX, offsetY);
    const state = this.state;

    state.circuloRedimensionando = null;
    state.arrastrando = false;
    state.desplazandoCanvas = false;
    state.objetosSeleccionados.forEach((obj) => (obj.seleccionado = false));
    state.offsets.clear();
    state.textoRedimensionando = null;

    this.actualizarCursor(x, y);
    this.dibujar();
  }

  handleDoubleClick(e) {
    const { clientX, clientY, offsetX, offsetY } = e;
    const { x, y } = this.transformarCoordenadas(offsetX, offsetY);
    const state = this.state;

    for (const obj of state.objetos) {
      if (obj instanceof Circulo && obj.contienePunto(x, y)) {
        this.mostrarPopup(obj, clientX, clientY);
        return;
      }
      if (obj instanceof Texto && obj.contienePunto(x, y)) {
        state.objetoEditando = obj;
        this.mostrarEditorTexto(obj, x, y);
        return;
      }
      if (
        (obj instanceof ComponenteTexto ||
          obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo) &&
        obj.contienePunto(x, y)
      ) {
        // Buscar qué texto dentro del componente fue clickeado
        for (let i = 0; i < obj.hijos.length; i++) {
          if (obj.hijos[i].contienePunto(x, y)) {
            state.objetoEditando = obj.hijos[i];
            this.mostrarEditorTexto(obj.hijos[i], x, y);
            return;
          }
        }
      }
    }
  }

  handleWheel(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const zoomFactor = 1.1;
    const { offsetX, offsetY } = e;
    const { x: mx, y: my } = this.transformarCoordenadas(offsetX, offsetY);
    const state = this.state;

    const nuevoZoom =
      e.deltaY < 0 ? state.zoom * zoomFactor : state.zoom / zoomFactor;

    // Mantener punto del mouse centrado al hacer zoom
    state.offsetCanvas.x -= mx * nuevoZoom - mx * state.zoom;
    state.offsetCanvas.y -= my * nuevoZoom - my * state.zoom;
    state.zoom = nuevoZoom;

    this.dibujar();
  }

  handleKeyDown(e) {
    const state = this.state;

    if (e.key === "Escape") {
      this.editorTexto.style.display = "none";
      state.objetoEditando = null;
    }
    if (e.key === "Enter" && e.ctrlKey) {
      if (state.objetoEditando) {
        state.objetoEditando.texto = this.editorTexto.value;
        this.editorTexto.style.display = "none";
        state.objetoEditando = null;
        this.dibujar();
      }
    }
    if (e.code === "Space" && !state.modoPanActivo) {
      state.modoPanActivo = true;
      this.canvas.style.cursor = "grab";
    }
    if (e.ctrlKey) {
      if (e.key === "z") return this.deshacer();
      if (e.key === "y") return this.rehacer();
      if (e.key === "d") return this.duplicar();
    }
    if (e.key === "Delete") return this.eliminar();
  }

  handleKeyUp(e) {
    if (e.code === "Space") {
      this.state.modoPanActivo = false;
      this.state.desplazandoCanvas = false;
      this.canvas.style.cursor = "default";
    }
  }

  // Métodos de UI
  mostrarEditorTexto(textoObj, pantallaX, pantallaY) {
    this.editorTexto.value = textoObj.texto;
    this.editorTexto.style.left = pantallaX + "px";
    this.editorTexto.style.top = pantallaY + "px";
    this.editorTexto.style.width = textoObj.ancho + "px";
    this.editorTexto.style.height = "auto";
    this.editorTexto.style.lineHeight = textoObj.fontSize + 4 + "px";
    this.editorTexto.style.fontSize = textoObj.fontSize + "px";
    this.editorTexto.style.display = "block";
    this.editorTexto.style.textAlign = textoObj.alineacion || "left";

    this.editorTexto.focus();
    this.autosizeTextarea(this.editorTexto);
    this.state.objetoEditando = textoObj;

    this.editorTexto.onblur = () => {
      textoObj.texto = this.editorTexto.value;
      this.editorTexto.style.display = "none";
      this.state.objetoEditando = null;
      this.dibujar();
    };
  }

  mostrarPopup(circulo, x, y) {
    this.popup.style.left = x + "px";
    this.popup.style.top = y + "px";
    this.popup.style.display = "block";

    const imgUrlInput = this.popup.querySelector("#imgUrl");
    const imgFileInput = this.popup.querySelector("#imgFile");
    imgUrlInput.value = "";
    imgFileInput.value = "";

    const listenerUrl = () => {
      const url = imgUrlInput.value;
      const img = new Image();
      img.onload = () => {
        circulo.imagen = img;
        this.dibujar();
        this.ocultarPopup();
      };
      img.src = url;
    };

    imgUrlInput.onchange = listenerUrl;
    imgFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            circulo.imagen = img;
            this.dibujar();
            this.ocultarPopup();
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    };
  }

  ocultarPopup() {
    this.popup.style.display = "none";
    const imgUrlInput = this.popup.querySelector("#imgUrl");
    const imgFileInput = this.popup.querySelector("#imgFile");
    imgUrlInput.value = "";
    imgFileInput.value = "";
  }

  // Métodos de gestión de objetos
  moverZ(dir) {
    this.state.objetosSeleccionados.forEach((obj) => {
      const i = this.state.objetos.indexOf(obj);
      this.state.objetos.splice(i, 1);
      dir === "frente"
        ? this.state.objetos.push(obj)
        : this.state.objetos.unshift(obj);
    });
    this.dibujar();
  }

  duplicar() {
    this.guardarHistorial();
    this.state.objetosSeleccionados.forEach((obj) => {
      let copia = null;
      if (obj instanceof Circulo) {
        copia = new Circulo(obj.x + 20, obj.y + 20, obj.radio, obj.color);
      } else if (obj instanceof Texto) {
        copia = new Texto(
          obj.x + 20,
          obj.y + 20,
          obj.texto,
          obj.fontSize,
          obj.color,
          obj.ancho
        );
      }
      if (copia) this.state.objetos.push(copia);
    });
    this.guardarHistorial();
    this.dibujar();
  }

  eliminar() {
    this.state.objetos = this.state.objetos.filter(
      (obj) => !this.state.objetosSeleccionados.includes(obj)
    );
    this.guardarHistorial();
    this.dibujar();
  }

  // Métodos de historial
  guardarHistorial() {
    const { historial, indiceHistorial } = this.state;

    this.state.historial = historial.slice(0, indiceHistorial + 1);
    const snapshot = JSON.stringify(this.state.objetos);
    this.state.historial.push(snapshot);
    if (this.state.historial.length > 20) this.state.historial.shift();
    this.state.indiceHistorial = this.state.historial.length - 1;
  }

  deshacer() {
    if (this.state.indiceHistorial > 0) {
      this.state.indiceHistorial--;
      const estadoPrevio = JSON.parse(
        this.state.historial[this.state.indiceHistorial]
      );
      this.restaurarEstado(estadoPrevio);
    }
  }

  rehacer() {
    if (this.state.indiceHistorial < this.state.historial.length - 1) {
      this.state.indiceHistorial++;
      const estadoFuturo = JSON.parse(
        this.state.historial[this.state.indiceHistorial]
      );
      this.restaurarEstado(estadoFuturo);
    }
  }

  restaurarEstado(estado) {
    this.state.objetos = estado
      .map((obj) => {
        if (obj.radio) return new Circulo(obj.x, obj.y, obj.radio, obj.color);
        if (obj.texto) {
          return new Texto(
            obj.x,
            obj.y,
            obj.texto,
            obj.fontSize,
            obj.color,
            obj.ancho
          );
        }
        if (obj.origen && obj.destino) {
          return new Flecha(obj.origen, obj.destino, obj.color);
        }
        return null;
      })
      .filter(Boolean);
    this.dibujar();
  }

  // Métodos de importación/exportación
  exportarJSON() {
    // Función para convertir imagen a Base64
    const convertirImagenABase64 = (circulo) => {
      return new Promise((resolve) => {
        if (!circulo.imagen) {
          resolve(null);
          return;
        }

        const canvas = document.createElement("canvas");
        // Usar el tamaño original de la imagen
        canvas.width = circulo.imagen.naturalWidth || circulo.imagen.width;
        canvas.height = circulo.imagen.naturalHeight || circulo.imagen.height;
        const ctx = canvas.getContext("2d");

        // Dibujar la imagen completa sin recortar
        ctx.drawImage(circulo.imagen, 0, 0, canvas.width, canvas.height);

        resolve({
          dataURL: canvas.toDataURL(),
          width: canvas.width,
          height: canvas.height,
        });
      });
    };

    // Asignar IDs temporales a todos los objetos
    this.state.objetos.forEach((obj) => {
      if (!obj.tempId) {
        obj.tempId = this.generarIdUnico();
      }
    });

    // Procesar todos los objetos para exportación
    Promise.all(
      this.state.objetos.map(async (obj) => {
        const objData = { type: obj.constructor.name };

        if (obj instanceof Circulo) {
          objData.x = obj.x;
          objData.y = obj.y;
          objData.radio = obj.radio;
          objData.color = obj.color;
          objData.tempId = obj.tempId;
          if (obj.imagen) {
            const imagenData = await convertirImagenABase64(obj);
            objData.imagenBase64 = imagenData.dataURL;
            objData.imagenWidth = imagenData.width;
            objData.imagenHeight = imagenData.height;
          }
        } else if (obj instanceof Texto) {
          objData.x = obj.x;
          objData.y = obj.y;
          objData.texto = obj.texto;
          objData.fontSize = obj.fontSize;
          objData.color = obj.color;
          objData.ancho = obj.ancho;
          objData.alineacion = obj.alineacion;
          objData.tempId = obj.tempId;
        } else if (obj instanceof Flecha) {
          objData.origenTempId = obj.origen.tempId;
          objData.destinoTempId = obj.destino.tempId;
          objData.color = obj.color;
        } else if (
          obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo
        ) {
          objData.x = obj.x;
          objData.y = obj.y;
          objData.ancho = obj.ancho;
          objData.tempId = obj.tempId;
          objData.hijos = obj.hijos.map((hijo) => {
            return {
              x: hijo.x,
              y: hijo.y,
              texto: hijo.texto,
              fontSize: hijo.fontSize,
              color: hijo.color,
              ancho: hijo.ancho,
              alineacion: hijo.alineacion,
              tempId: hijo.tempId,
            };
          });
        } else if (obj instanceof ComponenteTexto) {
          objData.x = obj.x;
          objData.y = obj.y;
          objData.ancho = obj.ancho;
          objData.tempId = obj.tempId;
          objData.hijos = obj.hijos.map((hijo) => {
            return {
              x: hijo.x,
              y: hijo.y,
              texto: hijo.texto,
              fontSize: hijo.fontSize,
              color: hijo.color,
              ancho: hijo.ancho,
              alineacion: hijo.alineacion,
              tempId: hijo.tempId || this.generarIdUnico(),
            };
          });
        }

        return objData;
      })
    )
      .then((objetosParaExportar) => {
        const data = JSON.stringify(objetosParaExportar);
        const blob = new Blob([data], { type: "application/json" });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = "mini_figma_design.json";
        enlace.click();
      })
      .catch((error) => {
        console.error("Error al exportar:", error);
        alert("Ocurrió un error al exportar el diseño");
      });
  }

  importarJSON(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = async ({ target }) => {
      try {
        const parsed = JSON.parse(target.result);

        // Mapa para guardar relaciones entre IDs temporales y objetos
        const idMap = new Map();
        const objetosCargados = [];

        // Primera pasada: crear todos los objetos básicos
        for (const objData of parsed) {
          if (objData.type === "Circulo") {
            const nuevoCirculo = new Circulo(
              objData.x,
              objData.y,
              objData.radio,
              objData.color
            );

            if (objData.imagenBase64) {
              nuevoCirculo.imagen = await this.cargarImagenDesdeBase64(
                objData.imagenBase64,
                objData.imagenWidth,
                objData.imagenHeight
              );
            }

            objetosCargados.push(nuevoCirculo);
            if (objData.tempId) idMap.set(objData.tempId, nuevoCirculo);
          } else if (objData.type === "Texto") {
            const nuevoTexto = new Texto(
              objData.x,
              objData.y,
              objData.texto,
              objData.fontSize,
              objData.color,
              objData.ancho,
              objData.alineacion
            );
            objetosCargados.push(nuevoTexto);
            if (objData.tempId) idMap.set(objData.tempId, nuevoTexto);
          } else if (objData.type === "ComponenteTexto") {
            // Crear los hijos primero
            const hijos = objData.hijos.map((hijoData) => {
              const hijo = new Texto(
                hijoData.x,
                hijoData.y,
                hijoData.texto,
                hijoData.fontSize,
                hijoData.color,
                hijoData.ancho,
                hijoData.alineacion
              );
              if (hijoData.tempId) idMap.set(hijoData.tempId, hijo);
              return hijo;
            });

            const nuevoComponente = new ComponenteTexto(objData.x, objData.y);
            nuevoComponente.hijos = hijos;
            nuevoComponente.ancho = objData.ancho;
            objetosCargados.push(nuevoComponente);
            if (objData.tempId) idMap.set(objData.tempId, nuevoComponente);
          } else if (
            objData.type === "ComponenteTituloSumario" ||
            objData.type === "ComponenteTituloCargo"
          ) {
            const ClaseComponente =
              objData.type === "ComponenteTituloSumario"
                ? ComponenteTituloSumario
                : ComponenteTituloCargo;

            const nuevoComponente = new ClaseComponente(objData.x, objData.y);
            nuevoComponente.ancho = objData.ancho;

            // Reconstruir hijos
            nuevoComponente.hijos = objData.hijos.map((hijoData) => {
              const hijo = new Texto(
                hijoData.x,
                hijoData.y,
                hijoData.texto,
                hijoData.fontSize,
                hijoData.color,
                hijoData.ancho,
                hijoData.alineacion
              );
              hijo.tempId = hijoData.tempId;
              idMap.set(hijoData.tempId, hijo);
              return hijo;
            });

            objetosCargados.push(nuevoComponente);
            if (objData.tempId) idMap.set(objData.tempId, nuevoComponente);
          } else if (objData.type === "Flecha") {
            // Guardar datos de flecha para procesar después
            objetosCargados.push(objData);
          }
        }

        // Segunda pasada: procesar flechas
        const objetosFinales = objetosCargados.filter(
          (obj) => obj.type !== "Flecha"
        );

        for (const objData of objetosCargados) {
          if (objData.type === "Flecha") {
            const origen = idMap.get(objData.origenTempId);
            const destino = idMap.get(objData.destinoTempId);

            if (origen && destino) {
              objetosFinales.unshift(
                new Flecha(origen, destino, objData.color)
              );
            }
          }
        }

        this.state.objetos = objetosFinales;
        this.dibujar();
      } catch (e) {
        console.error("Importación fallida", e);
        alert(
          "Error al importar el archivo. Asegúrate de que es un archivo válido."
        );
      }
    };
    lector.readAsText(archivo);
  }

  // Nuevos métodos auxiliares
  generarIdUnico() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  cargarImagenDesdeBase64(base64, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Guardar las dimensiones originales
        img.originalWidth = width || img.width;
        img.originalHeight = height || img.height;
        resolve(img);
      };
      img.src = base64;
    });
  }

  // Métodos de utilidad
  actualizarCursor(x, y) {
    const state = this.state;

    if (state.textoRedimensionando) {
      this.canvas.style.cursor = "ew-resize";
      return;
    }

    for (const obj of state.objetos) {
      if (obj instanceof Circulo && obj.estaSobreHandler(x, y)) {
        this.canvas.style.cursor = "nwse-resize";
        return;
      }
      if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
        this.canvas.style.cursor = "ew-resize";
        return;
      }
    }

    if (state.conectandoFlecha) {
      this.canvas.style.cursor = "crosshair";
      return;
    }

    const hovering = state.objetos.some((obj) => obj.contienePunto(x, y));
    this.canvas.style.cursor = state.arrastrando
      ? "grabbing"
      : hovering
      ? "move"
      : "default";
  }

  transformarCoordenadas(x, y) {
    const { zoom, offsetCanvas } = this.state;
    return {
      x: (x - offsetCanvas.x) / zoom,
      y: (y - offsetCanvas.y) / zoom,
    };
  }

  autosizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
}

// Clases de objetos del canvas
class Circulo {
  constructor(x, y, radio, color, imagen = null) {
    this.x = x;
    this.y = y;
    this.radio = radio;
    this.color = color;
    this.seleccionado = false;
    this.imagen = imagen;
  }

  dibujar(ctx) {
    if (this.imagen) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
      ctx.clip();

      // Usar las dimensiones originales guardadas
      const imgWidth = this.imagen.originalWidth || this.imagen.width;
      const imgHeight = this.imagen.originalHeight || this.imagen.height;
      const imgAspect = imgWidth / imgHeight;
      const circleAspect = 1;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > circleAspect) {
        drawHeight = this.radio * 2;
        drawWidth = drawHeight * imgAspect;
        offsetX = -(drawWidth - this.radio * 2) / 2;
        offsetY = 0;
      } else {
        drawWidth = this.radio * 2;
        drawHeight = drawWidth / imgAspect;
        offsetX = 0;
        offsetY = -(drawHeight - this.radio * 2) / 2;
      }

      ctx.drawImage(
        this.imagen,
        this.x - this.radio + offsetX,
        this.y - this.radio + offsetY,
        drawWidth,
        drawHeight
      );

      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radio, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (this.seleccionado) {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (this.seleccionado) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.x + this.radio + 5, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  contienePunto(x, y) {
    return Math.hypot(x - this.x, y - this.y) < this.radio;
  }

  estaSobreHandler(x, y) {
    const handleX = this.x + this.radio + 5;
    const handleY = this.y;
    return Math.hypot(x - handleX, y - handleY) <= 5;
  }
}

// Añadir nueva clase ComponenteTexto
class ComponenteTexto {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hijos = [
      new Texto(x, y, "Título", 36, "#111111", 400, "center"),
      new Texto(x, y + 40, "Sumario", 24, "#333333", 400, "left"),
      new Texto(x, y + 80, "Texto principal", 18, "#444444", 400, "justify"),
      new Texto(x, y + 180, "Nombre del autor", 20, "#000000", 300, "left"),
      new Texto(x, y + 210, "Cargo del autor", 16, "#666666", 300, "left"),
      new Texto(x + 200, y + 210, "2025", 16, "#999999", 100, "right"),
    ];
    this.seleccionado = false;
    this.ancho = 400;

    // Asignar IDs temporales a los hijos
    this.hijos.forEach((hijo) => {
      hijo.tempId = this.generarIdUnico();
    });
  }

  generarIdUnico() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
  dibujar(ctx) {
    // Dibujar todos los hijos
    this.hijos.forEach((hijo) => hijo.dibujar(ctx));

    // Dibujar borde de selección
    if (this.seleccionado) {
      const altoTotal = this.calcularAltoTotal();
      ctx.strokeStyle = "#00000088";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 10, this.y - 30, this.ancho + 20, altoTotal + 50);
    }
  }

  calcularAltoTotal() {
    // Calcular el alto total basado en la posición del último elemento
    const ultimoHijo = this.hijos[this.hijos.length - 1];
    return ultimoHijo.y - this.y + ultimoHijo.fontSize + 20;
  }

  contienePunto(x, y) {
    const altoTotal = this.calcularAltoTotal();
    return (
      x > this.x - 10 &&
      x < this.x + this.ancho + 10 &&
      y > this.y - 30 &&
      y < this.y + altoTotal + 20
    );
  }

  mover(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.hijos.forEach((h) => {
      h.x += dx;
      h.y += dy;
    });
  }

  // Método para editar un texto específico del componente
  editarTexto(indice, nuevoTexto) {
    if (indice >= 0 && indice < this.hijos.length) {
      this.hijos[indice].texto = nuevoTexto;
    }
  }
}
// Nuevas clases para los componentes
class ComponenteTituloSumario {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hijos = [
      new Texto(x, y, "Título Principal", 36, "#111111", 400, "center"),
      new Texto(x, y + 50, "Sumario descriptivo", 24, "#333333", 400, "center"),
    ];
    this.seleccionado = false;
    this.ancho = 400;
    this.type = "ComponenteTituloSumario";

    // Asignar IDs temporales
    this.hijos.forEach((hijo) => {
      hijo.tempId = this.generarIdUnico();
    });
    this.tempId = MiniFigma.instance.generarIdUnico();
  }
  generarIdUnico() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  dibujar(ctx) {
    this.hijos.forEach((hijo) => hijo.dibujar(ctx));

    if (this.seleccionado) {
      const altoTotal = this.hijos[1].y - this.y + this.hijos[1].fontSize + 20;
      ctx.strokeStyle = "#00000088";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 10, this.y - 10, this.ancho + 20, altoTotal + 20);
    }
  }

  contienePunto(x, y) {
    const ultimoHijo = this.hijos[this.hijos.length - 1];
    const altoTotal = ultimoHijo.y - this.y + ultimoHijo.fontSize + 20;
    return (
      x > this.x - 10 &&
      x < this.x + this.ancho + 10 &&
      y > this.y - 10 &&
      y < this.y + altoTotal + 10
    );
  }

  mover(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.hijos.forEach((h) => {
      h.x += dx;
      h.y += dy;
    });
  }
}

class ComponenteTituloCargo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hijos = [
      new Texto(x, y, "Título Secundario", 28, "#111111", 400, "left"),
      new Texto(x, y + 40, "Cargo o Posición", 18, "#666666", 400, "left"),
      new Texto(
        x,
        y + 70,
        "Texto complementario o descripción adicional del cargo y responsabilidades.",
        16,
        "#444444",
        400,
        "left"
      ),
    ];
    this.seleccionado = false;
    this.ancho = 400;
    this.type = "ComponenteTituloCargo";

    // Asignar IDs temporales
    this.hijos.forEach((hijo) => {
      hijo.tempId = this.generarIdUnico();
    });
    this.tempId = MiniFigma.instance.generarIdUnico();
  }

  generarIdUnico() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  dibujar(ctx) {
    this.hijos.forEach((hijo) => hijo.dibujar(ctx));

    if (this.seleccionado) {
      const ultimoHijo = this.hijos[this.hijos.length - 1];
      const lineas = ultimoHijo.texto.split("\n").length || 1;
      const altoTotal =
        ultimoHijo.y - this.y + (ultimoHijo.fontSize + 4) * lineas + 20;

      ctx.strokeStyle = "#00000088";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 10, this.y - 10, this.ancho + 20, altoTotal + 20);
    }
  }

  contienePunto(x, y) {
    const ultimoHijo = this.hijos[this.hijos.length - 1];
    const lineas = ultimoHijo.texto.split("\n").length || 1;
    const altoTotal =
      ultimoHijo.y - this.y + (ultimoHijo.fontSize + 4) * lineas + 20;

    return (
      x > this.x - 10 &&
      x < this.x + this.ancho + 10 &&
      y > this.y - 10 &&
      y < this.y + altoTotal + 10
    );
  }

  mover(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.hijos.forEach((h) => {
      h.x += dx;
      h.y += dy;
    });
  }
}

class Texto {
  constructor(
    x,
    y,
    texto,
    fontSize = 16,
    color = "black",
    ancho = 200,
    alineacion = "left"
  ) {
    this.x = x;
    this.y = y;
    this.texto = texto;
    this.fontSize = fontSize;
    this.color = color;
    this.seleccionado = false;
    this.ancho = ancho;
    this.alineacion = alineacion;
  }

  dibujar(ctx) {
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px Arial`;
    const lineas = this.dividirTextoEnLineas(ctx);

    lineas.forEach((l, i) => {
      ctx.textAlign = this.alineacion;
      let textoX = this.x;
      if (this.alineacion === "center") textoX = this.x + this.ancho / 2;
      if (this.alineacion === "right") textoX = this.x + this.ancho;

      ctx.fillText(l.trim(), textoX, this.y + i * (this.fontSize + 4));
    });

    if (this.seleccionado) {
      const alto = lineas.length * (this.fontSize + 4);
      ctx.strokeStyle = "#000000cc";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        this.x - 5,
        this.y - this.fontSize,
        this.ancho + 10,
        alto + 10
      );

      ctx.fillStyle = "red";
      ctx.fillRect(this.x + this.ancho + 5, this.y - this.fontSize, 8, 8);
    }
  }

  dividirTextoEnLineas(ctx) {
    const lineas = [];
    let palabras = this.texto.split(" ");
    let linea = "";

    for (let palabra of palabras) {
      const prueba = linea + palabra + " ";
      if (ctx.measureText(prueba).width > this.ancho) {
        lineas.push(linea);
        linea = palabra + " ";
      } else {
        linea = prueba;
      }
    }
    lineas.push(linea);
    return lineas;
  }

  contienePunto(x, y) {
    const lineHeight = this.fontSize + 4;
    const lineas = this.texto.split("\n").length || 1;
    const alto = lineas * lineHeight;

    return (
      x > this.x &&
      x < this.x + this.ancho &&
      y > this.y - this.fontSize &&
      y < this.y + alto
    );
  }

  estaSobreHandler(x, y) {
    return (
      x > this.x + this.ancho + 5 &&
      x < this.x + this.ancho + 13 &&
      y > this.y - this.fontSize &&
      y < this.y - this.fontSize + 8
    );
  }
}

class Flecha {
  constructor(origen, destino, color = "black") {
    this.origen = origen;
    this.destino = destino;
    this.color = color;
  }

  dibujar(ctx) {
    const { x: x1, y: y1 } = this.calcularBorde(this.origen, this.destino);
    const { x: x2, y: y2 } = this.calcularBorde(this.destino, this.origen);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const obstaculo = this.detectarObstaculo(x1, y1, x2, y2);

    if (obstaculo) {
      const medioX = (x1 + x2) / 2;
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(medioX, y1, medioX, (y1 + y2) / 2);
      ctx.quadraticCurveTo(medioX, y2, x2, y2);
    } else {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    this.dibujarPunta(ctx, x1, y1, x2, y2);
  }

  calcularBorde(origen, destino) {
    const dx = destino.x - origen.x;
    const dy = destino.y - origen.y;
    const ang = Math.atan2(dy, dx);
    const r = origen.radio || 0;
    return {
      x: origen.x + r * Math.cos(ang),
      y: origen.y + r * Math.sin(ang),
    };
  }

  detectarObstaculo(x1, y1, x2, y2) {
    const margen = 10;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    return MiniFigma.instance.state.objetos.find((obj) => {
      if (obj === this.origen || obj === this.destino) return false;

      if (obj instanceof Circulo) {
        return (
          obj.x + obj.radio > minX - margen &&
          obj.x - obj.radio < maxX + margen &&
          obj.y + obj.radio > minY - margen &&
          obj.y - obj.radio < maxY + margen
        );
      } else if (obj instanceof Texto) {
        return (
          obj.x < maxX + margen &&
          obj.x + obj.ancho > minX - margen &&
          obj.y < maxY + margen &&
          obj.y > minY - margen
        );
      }
      return false;
    });
  }

  dibujarPunta(ctx, x1, y1, x2, y2) {
    const angulo = Math.atan2(y2 - y1, x2 - x1);
    const tamañoFlecha = 10;
    const espacioAntes = 8;

    // Calcular la posición de la punta, dejando espacio antes del destino
    const puntaX = x2 - espacioAntes * Math.cos(angulo);
    const puntaY = y2 - espacioAntes * Math.sin(angulo);

    ctx.beginPath();
    ctx.moveTo(puntaX, puntaY);
    ctx.lineTo(
      puntaX - tamañoFlecha * Math.cos(angulo - Math.PI / 6),
      puntaY - tamañoFlecha * Math.sin(angulo - Math.PI / 6)
    );
    ctx.lineTo(
      puntaX - tamañoFlecha * Math.cos(angulo + Math.PI / 6),
      puntaY - tamañoFlecha * Math.sin(angulo + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  contienePunto() {
    return false;
  }
}

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  MiniFigma.instance = new MiniFigma();
});
