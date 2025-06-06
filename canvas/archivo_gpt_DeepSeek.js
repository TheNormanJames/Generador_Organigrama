// MiniFigma Optimizado - Versión Consolidada

class MiniFigma {
  constructor() {
    this.canvas = document.getElementById('miCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();

    this.initFormatButtons();

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
  initFormatButtons() {
    const botonesFormato = [
      { id: 'btnBold', tipo: 'bold' },
      { id: 'btnItalic', tipo: 'italic' },
      { id: 'btnAlignLeft', tipo: 'align-left' },
      { id: 'btnAlignCenter', tipo: 'align-center' },
      { id: 'btnAlignRight', tipo: 'align-right' },
    ];

    botonesFormato.forEach((boton) => {
      const elemento = document.getElementById(boton.id);
      elemento.addEventListener('mousedown', (e) => {
        e.preventDefault();

        // Solo para bold e italic, manejar selección de texto
        if (boton.tipo === 'bold' || boton.tipo === 'italic') {
          this.aplicarFormatoTextoSeleccionado(boton.tipo);
        } else {
          this.aplicarFormato(boton.tipo);
        }
      });
    });
  }

  aplicarFormato(tipo) {
    // Si estamos editando un texto, aplicamos al texto en edición
    if (this.state.objetoEditando) {
      this.aplicarFormatoATexto(this.state.objetoEditando, tipo);
      return;
    }

    // Si no, aplicamos a todos los textos seleccionados
    this.state.objetosSeleccionados.forEach((obj) => {
      if (obj instanceof Texto) {
        this.aplicarFormatoATexto(obj, tipo);
      } else if (obj.hijos) {
        // Para componentes con textos hijos
        obj.hijos.forEach((hijo) => {
          if (hijo instanceof Texto) {
            this.aplicarFormatoATexto(hijo, tipo);
          }
        });
      }
    });

    this.dibujar();
  }
  aplicarFormatoATexto(textoObj, tipo) {
    switch (tipo) {
      case 'bold':
        textoObj.bold = !textoObj.bold;
        break;
      case 'italic':
        textoObj.italic = !textoObj.italic;
        break;
      case 'align-left':
        textoObj.alineacion = 'left';
        break;
      case 'align-center':
        textoObj.alineacion = 'center';
        break;
      case 'align-right':
        textoObj.alineacion = 'right';
        break;
    }

    // Actualizar editor de texto si está visible
    if (this.state.objetoEditando === textoObj) {
      this.actualizarEstilosEditor();
    }
  }

  aplicarFormatoTextoSeleccionado(tipo) {
    if (!this.state.objetoEditando || !this.editorTexto) return;

    const textarea = this.editorTexto;
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;

    if (inicio === fin) return; // No hay texto seleccionado

    // Aplicar/remover formato
    this.state.objetoEditando.aplicarFormato(inicio, fin, tipo);

    // Actualizar botones (para mostrar estado activo/inactivo)
    this.actualizarEstadoBotones();

    // Redibujar
    this.dibujar();
  }
  actualizarEstilosEditor() {
    const textoObj = this.state.objetoEditando;
    this.editorTexto.style.fontWeight = textoObj.bold ? 'bold' : 'normal';
    this.editorTexto.style.fontStyle = textoObj.italic ? 'italic' : 'normal';
    this.editorTexto.style.textAlign = textoObj.alineacion;
  }
  actualizarEstadoBotones() {
    if (!this.state.objetoEditando) return;

    const textarea = this.editorTexto;
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;

    if (inicio === fin) {
      // Sin selección - desactivar botones
      document.getElementById('btnBold').classList.remove('active');
      document.getElementById('btnItalic').classList.remove('active');
      return;
    }

    // Verificar formatos en la selección actual
    const textoObj = this.state.objetoEditando;
    const tieneBold = textoObj.formatos.some(
      (f) => f.tipo === 'bold' && f.inicio < fin && f.fin > inicio
    );
    const tieneItalic = textoObj.formatos.some(
      (f) => f.tipo === 'italic' && f.inicio < fin && f.fin > inicio
    );

    // Actualizar apariencia de botones
    document.getElementById('btnBold').classList.toggle('active', tieneBold);
    document
      .getElementById('btnItalic')
      .classList.toggle('active', tieneItalic);
  }
  aplicarAlineacion(alineacion) {
    if (
      !this.state.objetoEditando &&
      this.state.objetosSeleccionados.length === 0
    )
      return;

    const textoObj =
      this.state.objetoEditando ||
      this.state.objetosSeleccionados.find((obj) => obj instanceof Texto);

    if (!textoObj) return;

    textoObj.alineacion = alineacion;
    this.dibujar();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 65;

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight - 65;
      this.dibujar();
    });
  }

  initUIElements() {
    // Editor de texto
    this.editorTexto = document.createElement('textarea');
    Object.assign(this.editorTexto.style, {
      position: 'absolute',
      display: 'none',
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      border: '1px solid #d1d5db',
      padding: '6px 8px',
      zIndex: '1000',
      resize: 'none',
      outline: 'none',
      backgroundColor: 'white',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      minHeight: '40px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    });
    this.editorTexto.addEventListener('input', () =>
      this.autosizeTextarea(this.editorTexto)
    );
    document.body.appendChild(this.editorTexto);

    document.getElementById('btnCancelarFlecha').onclick = () => {
      this.state.conectandoFlecha = false;
      this.state.puntoInicioFlecha = null;
      this.dibujar();
    };

    // Popup para imágenes
    this.popup = document.createElement('div');
    this.popup.style.position = 'absolute';
    this.popup.style.padding = '10px';
    this.popup.style.background = 'white';
    this.popup.style.border = '1px solid black';
    this.popup.style.display = 'none';
    this.popup.innerHTML = `
      <input type="text" placeholder="URL de imagen" id="imgUrl" style="display:block; margin-bottom:5px; width: 200px;"/>
      <input type="file" id="imgFile" accept="image/*"/>
    `;
    document.body.appendChild(this.popup);

    // Botones de la interfaz
    document.getElementById('circleBtn').onclick = () => this.crear('circulo');
    document.getElementById('btnTituloSumario').onclick = () =>
      this.crear('tituloSumario');
    document.getElementById('btnTituloCargo').onclick = () =>
      this.crear('tituloCargo');
    document.getElementById('circleFlecha').onclick = () =>
      this.crear('flechaConectada');
    document.getElementById('btnFrente').onclick = () => this.moverZ('frente');
    document.getElementById('btnFondo').onclick = () => this.moverZ('fondo');
    document.getElementById('btnExportar').onclick = () => this.exportarJSON();
    document.getElementById('btnImportar').onchange = (e) =>
      this.importarJSON(e);
    document.getElementById('btnExportarImagen').onclick = () =>
      this.exportarImagen();
    document.getElementById('btnToggleLimite').onclick = () =>
      this.toggleLimiteExportacion();
  }

  setupEventListeners() {
    // Eventos del canvas
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), {
      passive: false,
    });

    // Eventos del teclado
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
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

    // Dibujar límite de exportación si está activo (corregido)
    if (mostrarLimiteExportacion) {
      ctx.save();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(0, 0, anchoLimiteExportacion, canvas.height / zoom);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Dibujar flechas primero
    state.objetos
      .filter((obj) => obj instanceof Flecha)
      .forEach((obj) => obj.dibujar(ctx));

    // Ajustar y dibujar otros objetos
    state.objetos
      .filter((obj) => !(obj instanceof Flecha))
      .forEach((obj) => {
        if (obj instanceof Componente) {
          obj.ajustarPosiciones(ctx); // Ajustar con contexto válido
        }
        obj.dibujar(ctx);
      });
  }

  exportarImagen() {
    const { anchoLimiteExportacion } = this.state;
    const objetosDentroLimite = this.getObjetosDentroLimite();

    // Crear un canvas temporal para la exportación
    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');

    // Calcular dimensiones necesarias (corregido)
    const { minX, minY, maxX, maxY } =
      this.calcularDimensionesExportacion(objetosDentroLimite);
    const anchoExportacion = anchoLimiteExportacion;
    const altoExportacion = maxY - minY + 40; // +40 para margen

    // Configurar canvas temporal
    canvasTemp.width = anchoExportacion;
    canvasTemp.height = altoExportacion;
    ctxTemp.fillStyle = 'white';
    ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);

    // Dibujar objetos en el canvas temporal (ajustando coordenadas)
    objetosDentroLimite.forEach((obj) => {
      ctxTemp.save();

      // Ajustar posición para que todo quede dentro del canvas
      if (
        obj instanceof ComponenteTituloSumario ||
        obj instanceof ComponenteTituloCargo
      ) {
        obj.hijos.forEach((hijo) => {
          const x = hijo.x - minX + 20; // Ajustar X con margen
          const y = hijo.y - minY + 20; // Ajustar Y con margen
          this.dibujarObjetoEnContexto(ctxTemp, hijo, x, y);
        });
      } else {
        const x = obj.x - minX + 20; // Ajustar X con margen
        const y = obj.y - minY + 20; // Ajustar Y con margen
        this.dibujarObjetoEnContexto(ctxTemp, obj, x, y);
      }

      ctxTemp.restore();
    });

    // Crear enlace de descarga
    const enlace = document.createElement('a');
    enlace.href = canvasTemp.toDataURL('image/png');
    enlace.download = 'diseño_exportado.png';
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
        // obj instanceof ComponenteTexto ||
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
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objetos.forEach((obj) => {
      if (
        obj instanceof ComponenteTituloSumario ||
        obj instanceof ComponenteTituloCargo
      ) {
        obj.hijos.forEach((hijo) => {
          minX = Math.min(minX, hijo.x);
          minY = Math.min(minY, hijo.y - hijo.fontSize);
          maxX = Math.max(maxX, hijo.x + hijo.ancho);
          maxY = Math.max(maxY, hijo.y + hijo.fontSize);
        });
      } else if (obj instanceof Circulo) {
        minX = Math.min(minX, obj.x - obj.radio);
        minY = Math.min(minY, obj.y - obj.radio);
        maxX = Math.max(maxX, obj.x + obj.radio);
        maxY = Math.max(maxY, obj.y + obj.radio);
      } else if (obj instanceof Texto) {
        minX = Math.min(minX, obj.x);
        minY = Math.min(minY, obj.y - obj.fontSize);
        maxX = Math.max(maxX, obj.x + obj.ancho);
        maxY = Math.max(maxY, obj.y + obj.fontSize);
      }
    });

    return {
      minX: Math.max(0, minX - 20),
      minY: Math.max(0, minY - 20),
      maxX: maxX + 20,
      maxY: maxY + 20,
    };
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
      case 'circulo':
        objetos.push(new Circulo(100, 100, 30, 'blue'));
        break;
      case 'texto':
        objetos.push(new Texto(150, 150, 'Hola!', 18));
        break;
      case 'tituloSumario':
        objetos.push(new ComponenteTituloSumario(150, 150));
        break;
      case 'tituloCargo':
        objetos.push(new ComponenteTituloCargo(150, 150));
        break;
      case 'flechaConectada':
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
    alineacion = 'left',
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
    state.componenteRedimensionando = null; // Asegurarnos que empieza limpio

    // Verificar handlers de redimensionamiento
    for (const obj of state.objetos) {
      if (obj instanceof Circulo && obj.estaSobreHandler(x, y)) {
        state.circuloRedimensionando = obj;
        return;
      }
      if (
        (obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo) &&
        this.estaSobreHandlerRedimension(x, y, obj)
      ) {
        state.componenteRedimensionando = obj;
        return; // Si estamos redimensionando, no hacemos más comprobaciones
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
        /* if (obj instanceof ComponenteTexto) {
          state.offsets.set(obj, { dx: x - obj.x, dy: y - obj.y });
        } else {
          } */
        state.offsets.set(obj, { dx: x - obj.x, dy: y - obj.y });
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

    // En el método handleMouseDown, agregar esta condición para seleccionar flechas
    for (const obj of state.objetos) {
      if (obj instanceof Flecha && this.flechaContienePunto(obj, x, y)) {
        state.objetosSeleccionados = [obj];
        obj.seleccionado = true;
        break;
      }
    }

    // Modo pan
    if (state.modoPanActivo) {
      state.desplazandoCanvas = true;
      state.ultimaPosMouse = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    }

    this.guardarHistorial();
    this.dibujar();
  }

  estaSobreHandlerComponente(x, y, componente) {
    return (
      x > componente.x + componente.ancho - 10 &&
      x < componente.x + componente.ancho + 10 &&
      y > componente.y - 10 &&
      y < componente.y + this.calcularAltoComponente(componente) + 10
    );
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

    // Redimensionamiento de componentes (debe estar antes del movimiento normal)
    if (state.arrastrando && state.componenteRedimensionando) {
      const nuevoAncho = Math.max(100, x - state.componenteRedimensionando.x);
      state.componenteRedimensionando.ancho = nuevoAncho;

      // Actualizar ancho y recalcular posiciones
      state.componenteRedimensionando.ajustarPosiciones();

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
            // obj instanceof ComponenteTexto ||
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

    // Limpiar todos los estados de redimensionamiento
    state.circuloRedimensionando = null;
    state.textoRedimensionando = null;
    state.componenteRedimensionando = null; // ¡Esto es lo que faltaba!
    state.arrastrando = false;
    state.desplazandoCanvas = false;

    state.objetosSeleccionados.forEach((obj) => (obj.seleccionado = false));
    state.offsets.clear();

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
        // obj instanceof ComponenteTexto ||
        (obj instanceof ComponenteTituloSumario ||
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

    if (e.key === 'Escape') {
      this.editorTexto.style.display = 'none';
      state.objetoEditando = null;
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      if (state.objetoEditando) {
        state.objetoEditando.texto = this.editorTexto.value;
        this.editorTexto.style.display = 'none';
        state.objetoEditando = null;
        this.dibujar();
      }
    }
    if (e.code === 'Space' && !state.modoPanActivo) {
      state.modoPanActivo = true;
      this.canvas.style.cursor = 'grab';
    }
    if (e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        this.aplicarFormatoTextoSeleccionado('bold');
        return;
      }
      if (e.key === 'i') {
        e.preventDefault();
        this.aplicarFormatoTextoSeleccionado('italic');
        return;
      }
      if (e.key === 'z') return this.deshacer();
      if (e.key === 'y') return this.rehacer();
      if (e.key === 'd') return this.duplicar();
    }
    if (e.key === 'Delete') return this.eliminar();
  }

  handleKeyUp(e) {
    if (e.code === 'Space') {
      this.state.modoPanActivo = false;
      this.state.desplazandoCanvas = false;
      this.canvas.style.cursor = 'default';
    }
  }

  // Métodos de UI
  mostrarEditorTexto(textoObj, pantallaX, pantallaY) {
    this.editorTexto.value = textoObj.texto;
    this.editorTexto.style.left = pantallaX + 'px';
    this.editorTexto.style.top = pantallaY + 'px';
    this.editorTexto.style.width = textoObj.ancho + 'px';
    this.editorTexto.style.display = 'block';
    this.editorTexto.style.textAlign = textoObj.alineacion || 'left';

    this.editorTexto.focus();
    this.autosizeTextarea(this.editorTexto);
    this.state.objetoEditando = textoObj;

    this.editorTexto.onblur = () => {
      textoObj.texto = this.editorTexto.value;
      const padre = this.state.objetos.find((c) => c.hijos?.includes(textoObj));

      if (padre) {
        const ctx = this.ctx;
        const alturaAnterior = padre.calcularAltoTotal(ctx);
        padre.ajustarPosiciones(ctx);
        const nuevaAltura = padre.calcularAltoTotal(ctx);
        const diferencia = nuevaAltura - alturaAnterior;

        if (diferencia !== 0) {
          this.ajustarComponentesDebajo(padre, diferencia, ctx);
        }
      }

      this.editorTexto.style.display = 'none';
      this.state.objetoEditando = null;
      this.dibujar();
    };
    this.editorTexto.focus();

    // Actualizar estado de botones al mostrar editor
    this.actualizarEstadoBotones();

    // Configurar eventos para actualizar botones al seleccionar texto
    this.editorTexto.addEventListener('select', () =>
      this.actualizarEstadoBotones()
    );
  }
  ajustarComponentesDebajo(componenteModificado, deltaY, ctx) {
    if (deltaY === 0) return;

    const baseY = componenteModificado.y;
    const alturaComponente = componenteModificado.calcularAltoTotal(ctx);
    const limiteInferior = baseY + alturaComponente;

    this.state.objetos.forEach((obj) => {
      if (
        obj !== componenteModificado &&
        (obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo) &&
        obj.y >= baseY
      ) {
        // Mover el componente
        obj.y += deltaY;

        // Reajustar sus hijos con el contexto
        obj.ajustarPosiciones(ctx);
      }
    });
  }

  moverComponentesDebajo(componenteBase, deltaY) {
    if (deltaY === 0) return;

    const baseY = componenteBase.y;
    const baseBottom =
      componenteBase.y + this.calcularAltoComponente(componenteBase);

    this.state.objetos.forEach((obj) => {
      if (
        obj !== componenteBase &&
        (obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo)
      ) {
        // Solo mover componentes que estén debajo del componente base
        if (obj.y >= baseBottom) {
          obj.mover(0, deltaY);
          // Asegurarse de que los hijos también se muevan
          obj.ajustarPosiciones();
        }
      }
    });
  }
  calcularAltoTotalComponente(componente) {
    let alturaTotal = 0;
    componente.hijos.forEach((hijo, i) => {
      const lineas = hijo.texto.split('\n').length || 1;
      alturaTotal += lineas * (hijo.fontSize + 4);
      if (i < componente.hijos.length - 1) {
        alturaTotal += componente.espaciado;
      }
    });
    return alturaTotal;
  }

  mostrarPopup(circulo, x, y) {
    this.popup.style.left = x + 'px';
    this.popup.style.top = y + 'px';
    this.popup.style.display = 'block';

    const imgUrlInput = this.popup.querySelector('#imgUrl');
    const imgFileInput = this.popup.querySelector('#imgFile');
    imgUrlInput.value = '';
    imgFileInput.value = '';

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
    this.popup.style.display = 'none';
    const imgUrlInput = this.popup.querySelector('#imgUrl');
    const imgFileInput = this.popup.querySelector('#imgFile');
    imgUrlInput.value = '';
    imgFileInput.value = '';
  }

  // Métodos de gestión de objetos
  moverZ(dir) {
    this.state.objetosSeleccionados.forEach((obj) => {
      const i = this.state.objetos.indexOf(obj);
      this.state.objetos.splice(i, 1);
      dir === 'frente'
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

  // Nuevo método para verificar si un punto está cerca de una flecha
  flechaContienePunto(flecha, x, y, margen = 5) {
    // Verificar cada segmento de la flecha
    for (let i = 0; i < flecha.checkpoints.length - 1; i++) {
      const p1 = flecha.checkpoints[i];
      const p2 = flecha.checkpoints[i + 1];

      if (this.distanciaAPuntoLinea(x, y, p1.x, p1.y, p2.x, p2.y) < margen) {
        return true;
      }
    }
    return false;
  }

  // Método auxiliar para calcular distancia de punto a línea
  distanciaAPuntoLinea(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  eliminar() {
    // Obtener IDs de los objetos a eliminar
    const idsAEliminar = new Set(
      this.state.objetosSeleccionados.map((obj) => obj.tempId)
    );

    // Filtrar objetos principales y flechas conectadas
    this.state.objetos = this.state.objetos.filter((obj) => {
      // Eliminar objetos seleccionados directamente
      if (this.state.objetosSeleccionados.includes(obj)) {
        return false;
      }

      // Eliminar flechas que conectan a objetos que se están eliminando
      if (obj instanceof Flecha) {
        return !(
          idsAEliminar.has(obj.origen.tempId) ||
          idsAEliminar.has(obj.destino.tempId)
        );
      }

      return true;
    });

    this.guardarHistorial();
    this.dibujar();
  }

  // Métodos de historial
  guardarHistorial() {
    // Limpiar historial futuro si estamos en medio del historial
    if (this.state.indiceHistorial < this.state.historial.length - 1) {
      this.state.historial = this.state.historial.slice(
        0,
        this.state.indiceHistorial + 1
      );
    }

    // Crear una copia profunda del estado actual
    const snapshot = JSON.parse(
      JSON.stringify(
        this.state.objetos.map((obj) => {
          if (obj instanceof Flecha) {
            return {
              type: 'Flecha',
              origenTempId: obj.origen.tempId,
              destinoTempId: obj.destino.tempId,
              color: obj.color,
            };
          }
          return obj;
        })
      )
    );

    // Guardar el snapshot
    this.state.historial.push(snapshot);
    if (this.state.historial.length > 50) this.state.historial.shift();
    this.state.indiceHistorial = this.state.historial.length - 1;
  }

  deshacer() {
    if (this.state.indiceHistorial <= 0) return;

    this.state.indiceHistorial--;
    this.restaurarEstado(this.state.historial[this.state.indiceHistorial]);
  }

  rehacer() {
    if (this.state.indiceHistorial >= this.state.historial.length - 1) return;

    this.state.indiceHistorial++;
    this.restaurarEstado(this.state.historial[this.state.indiceHistorial]);
  }

  restaurarEstado(estado) {
    // Mapa para reconstruir referencias de flechas
    const idMap = new Map();

    // Primera pasada: crear todos los objetos básicos
    this.state.objetos = estado
      .map((objData) => {
        if (objData.type === 'Circulo') {
          const nuevoCirculo = new Circulo(
            objData.x,
            objData.y,
            objData.radio,
            objData.color
          );
          if (objData.tempId) idMap.set(objData.tempId, nuevoCirculo);
          return nuevoCirculo;
        } else if (objData.type === 'Texto') {
          const nuevoTexto = new Texto(
            objData.x,
            objData.y,
            objData.texto,
            objData.fontSize,
            objData.color,
            objData.ancho,
            objData.alineacion
          );
          if (objData.tempId) idMap.set(objData.tempId, nuevoTexto);
          return nuevoTexto;
        } else if (
          objData.type === 'ComponenteTituloSumario' ||
          objData.type === 'ComponenteTituloCargo'
        ) {
          const ClaseComponente =
            objData.type === 'ComponenteTituloSumario'
              ? ComponenteTituloSumario
              : ComponenteTituloCargo;

          const nuevoComponente = new ClaseComponente(objData.x, objData.y);
          nuevoComponente.ancho = objData.ancho;
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
            if (hijoData.tempId) idMap.set(hijoData.tempId, hijo);
            return hijo;
          });
          if (objData.tempId) idMap.set(objData.tempId, nuevoComponente);
          return nuevoComponente;
        } else if (objData.type === 'Flecha') {
          return objData;
        }
        return null;
      })
      .filter(Boolean);

    // Segunda pasada: procesar flechas
    const objetosFinales = this.state.objetos.filter(
      (obj) => obj.type !== 'Flecha'
    );

    this.state.objetos.forEach((obj) => {
      if (obj.type === 'Flecha') {
        const origen = idMap.get(obj.origenTempId);
        const destino = idMap.get(obj.destinoTempId);

        if (origen && destino) {
          objetosFinales.unshift(new Flecha(origen, destino, obj.color));
        }
      }
    });

    this.state.objetos = objetosFinales;
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

        const canvas = document.createElement('canvas');
        // Usar el tamaño original de la imagen
        canvas.width = circulo.imagen.naturalWidth || circulo.imagen.width;
        canvas.height = circulo.imagen.naturalHeight || circulo.imagen.height;
        const ctx = canvas.getContext('2d');

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
        const blob = new Blob([data], { type: 'application/json' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = 'mini_figma_design.json';
        enlace.click();
      })
      .catch((error) => {
        console.error('Error al exportar:', error);
        alert('Ocurrió un error al exportar el diseño');
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
          if (objData.type === 'Circulo') {
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
          } else if (objData.type === 'Texto') {
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
          } else if (objData.type === 'ComponenteTexto') {
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
            objData.type === 'ComponenteTituloSumario' ||
            objData.type === 'ComponenteTituloCargo'
          ) {
            const ClaseComponente =
              objData.type === 'ComponenteTituloSumario'
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
          } else if (objData.type === 'Flecha') {
            // Guardar datos de flecha para procesar después
            objetosCargados.push(objData);
          }
        }

        // Segunda pasada: procesar flechas
        const objetosFinales = objetosCargados.filter(
          (obj) => obj.type !== 'Flecha'
        );

        for (const objData of objetosCargados) {
          if (objData.type === 'Flecha') {
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
        console.error('Importación fallida', e);
        alert(
          'Error al importar el archivo. Asegúrate de que es un archivo válido.'
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

    // Primero verificar si estamos sobre un handler de redimensionamiento
    for (const obj of state.objetos) {
      if (
        (obj instanceof ComponenteTituloSumario ||
          obj instanceof ComponenteTituloCargo) &&
        this.estaSobreHandlerRedimension(x, y, obj)
      ) {
        this.canvas.style.cursor = 'col-resize';
        return;
      }
    }

    if (state.textoRedimensionando) {
      this.canvas.style.cursor = 'ew-resize';
      return;
    }

    for (const obj of state.objetos) {
      if (obj instanceof Circulo && obj.estaSobreHandler(x, y)) {
        this.canvas.style.cursor = 'nwse-resize';
        return;
      }
      if (obj instanceof Texto && obj.estaSobreHandler(x, y)) {
        this.canvas.style.cursor = 'ew-resize';
        return;
      }
    }

    if (state.conectandoFlecha) {
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    const hovering = state.objetos.some((obj) => obj.contienePunto(x, y));
    this.canvas.style.cursor = state.arrastrando
      ? 'grabbing'
      : hovering
      ? 'move'
      : 'default';
  }

  transformarCoordenadas(x, y) {
    const { zoom, offsetCanvas } = this.state;
    return {
      x: (x - offsetCanvas.x) / zoom,
      y: (y - offsetCanvas.y) / zoom,
    };
  }

  autosizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  estaSobreHandlerRedimension(x, y, componente) {
    const margen = 10;
    return (
      x >= componente.x + componente.ancho - margen &&
      x <= componente.x + componente.ancho + margen &&
      y >= componente.y - margen &&
      y <= componente.y + this.calcularAltoComponente(componente) + margen
    );
  }
  calcularAltoComponente(componente) {
    const ultimoHijo = componente.hijos[componente.hijos.length - 1];
    const lineas = ultimoHijo.texto.split('\n').length || 1;
    return ultimoHijo.y - componente.y + (ultimoHijo.fontSize + 4) * lineas;
  }
}

class Componente {
  constructor(x, y, tipo) {
    this.x = x;
    this.y = y;
    this.hijos = [];
    this.seleccionado = false;
    this.ancho = 400;
    this.type = tipo;
    this.espaciado = 10;
    this.margenInferior = 15;
  }

  ajustarPosiciones(ctx) {
    let yActual = this.y;

    this.hijos.forEach((hijo, index) => {
      // Usar el contexto para calcular la altura exacta
      const alturaTexto = hijo.actualizarAlturaTexto(ctx);

      hijo.x = this.x;
      hijo.y = yActual;
      hijo.ancho = this.ancho;

      yActual += alturaTexto;

      if (index < this.hijos.length - 1) {
        yActual += this.espaciado;
      }
    });

    return yActual - this.y; // Retornar altura total
  }
  calcularAltoTotal(ctx) {
    let alturaTotal = 0;

    this.hijos.forEach((hijo, index) => {
      alturaTotal += hijo.actualizarAlturaTexto(ctx);

      if (index < this.hijos.length - 1) {
        alturaTotal += this.espaciado;
      }
    });

    return alturaTotal;
  }

  dibujar(ctx) {
    this.hijos.forEach((hijo) => hijo.dibujar(ctx));

    if (this.seleccionado) {
      const ultimoHijo = this.hijos[this.hijos.length - 1];
      const lineas = ultimoHijo.texto.split('\n').length || 1;
      const altoTotal =
        ultimoHijo.y - this.y + (ultimoHijo.fontSize + 4) * lineas + 20;

      ctx.strokeStyle = '#00000088';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - 10, this.y - 10, this.ancho + 20, altoTotal + 20);
    }
  }

  contienePunto(x, y) {
    const ultimoHijo = this.hijos[this.hijos.length - 1];
    const lineas = ultimoHijo.texto.split('\n').length || 1;
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
    this.hijos.forEach((hijo) => {
      hijo.x += dx;
      hijo.y += dy;
    });
  }

  generarIdUnico() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

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
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (this.seleccionado) {
      ctx.fillStyle = 'red';
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

class ComponenteTituloSumario extends Componente {
  constructor(x, y) {
    super(x, y, 'ComponenteTituloSumario');
    this.espaciado = 15;
    this.hijos = [
      new Texto(x, y, 'Título Principal', 36, '#111111', 400, 'center'),
      new Texto(x, y + 50, 'Sumario descriptivo', 24, '#333333', 400, 'center'),
    ];
    this.ajustarPosiciones();

    // Asignar IDs
    this.hijos.forEach((hijo) => {
      hijo.tempId = this.generarIdUnico();
    });
    this.tempId = this.generarIdUnico();
  }
}

class ComponenteTituloCargo extends Componente {
  constructor(x, y) {
    super(x, y, 'ComponenteTituloCargo');
    this.hijos = [
      new Texto(x, y, 'Título Secundario', 28, '#111111', 400, 'left'),
      new Texto(x, y, 'Cargo o Posición', 18, '#666666', 400, 'left'),
      new Texto(
        x,
        y,
        'Texto complementario o descripción adicional del cargo y responsabilidades.',
        16,
        '#444444',
        400,
        'left'
      ),
    ];
    // Usar null como contexto inicial (se ajustará en el dibujado)
    this.ajustarPosiciones(null);

    this.hijos.forEach((hijo) => {
      hijo.tempId = this.generarIdUnico();
    });
    this.tempId = this.generarIdUnico();
  }
}

class Texto {
  constructor(
    x,
    y,
    texto,
    fontSize = 16,
    color = 'black',
    ancho = 200,
    alineacion = 'left'
  ) {
    this.x = x;
    this.y = y;
    this.texto = texto;
    this.fontSize = fontSize;
    this.color = color;
    this.seleccionado = false;
    this.ancho = ancho;
    this.alineacion = alineacion;
    this.formatos = []; // Array para guardar rangos con formato
  }

  aplicarFormato(inicio, fin, tipo) {
    // Normalizar posiciones
    const start = Math.min(inicio, fin);
    const end = Math.max(inicio, fin);

    // Verificar si ya existe el formato en ese rango
    const formatoExistente = this.formatos.find(
      (f) => f.inicio === start && f.fin === end && f.tipo === tipo
    );

    if (formatoExistente) {
      // Remover el formato si ya existe
      this.formatos = this.formatos.filter((f) => f !== formatoExistente);
    } else {
      // Eliminar formatos solapados del mismo tipo
      this.formatos = this.formatos.filter(
        (f) => !(f.tipo === tipo && f.inicio < end && f.fin > start)
      );

      // Agregar nuevo formato
      this.formatos.push({
        inicio: start,
        fin: end,
        tipo: tipo,
      });
    }

    // Ordenar formatos
    this.formatos.sort((a, b) => a.inicio - b.inicio);
  }
  fusionarFormatosSimilares() {
    if (this.formatos.length < 2) return;

    const nuevosFormatos = [];
    let current = this.formatos[0];

    for (let i = 1; i < this.formatos.length; i++) {
      const next = this.formatos[i];

      if (current.tipo === next.tipo && current.fin >= next.inicio) {
        // Fusionar formatos contiguos o solapados del mismo tipo
        current.fin = Math.max(current.fin, next.fin);
      } else {
        nuevosFormatos.push(current);
        current = next;
      }
    }

    nuevosFormatos.push(current);
    this.formatos = nuevosFormatos;
  }

  dividirTextoEnLineas(ctx) {
    // Verificar si tenemos contexto válido
    if (!ctx) {
      // Fallback: estimar líneas basado en longitud (menos preciso)
      const approxCharsPerLine = Math.floor(this.ancho / (this.fontSize * 0.6));
      const lineas = [];
      let remainingText = this.texto;

      while (remainingText.length > 0) {
        lineas.push(remainingText.substring(0, approxCharsPerLine));
        remainingText = remainingText.substring(approxCharsPerLine);
      }
      return lineas;
    }

    // Método preciso si tenemos contexto
    ctx.font = `${this.fontSize}px Arial`;
    const palabras = this.texto.split(' ');
    let lineas = [];
    let lineaActual = '';

    for (const palabra of palabras) {
      const prueba = lineaActual + (lineaActual ? ' ' : '') + palabra;
      const medida = ctx.measureText(prueba).width;

      if (medida > this.ancho && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = prueba;
      }
    }

    if (lineaActual) lineas.push(lineaActual);
    return lineas.length > 0 ? lineas : [this.texto];
  }

  actualizarAlturaTexto(ctx) {
    const lineas = this.dividirTextoEnLineas(ctx);
    return lineas.length * (this.fontSize + 4);
  }

  dibujar(ctx) {
    ctx.textAlign = this.alineacion;
    const lineas = this.dividirTextoEnLineas(ctx);
    let currentY = this.y;

    // Calcular posiciones absolutas de cada línea
    let posAbsolutaAcumulada = 0;
    const lineasConPosiciones = lineas.map((linea) => {
      const lineaObj = {
        texto: linea,
        inicio: posAbsolutaAcumulada,
        fin: posAbsolutaAcumulada + linea.length,
      };
      posAbsolutaAcumulada += linea.length + 1; // +1 por el salto de línea implícito
      return lineaObj;
    });

    // Dibujar cada línea
    for (const linea of lineasConPosiciones) {
      let currentX = this.x;
      if (this.alineacion === 'center') currentX = this.x + this.ancho / 2;
      if (this.alineacion === 'right') currentX = this.x + this.ancho;

      let currentPos = 0;

      while (currentPos < linea.texto.length) {
        const posAbsoluta = linea.inicio + currentPos;

        // Encontrar todos los formatos que aplican a esta posición
        const formatos = this.formatos.filter(
          (f) => posAbsoluta >= f.inicio && posAbsoluta < f.fin
        );

        // Determinar hasta dónde extender el formato actual
        let finSegmento = linea.texto.length;
        for (const formato of formatos) {
          finSegmento = Math.min(finSegmento, formato.fin - linea.inicio);
        }

        // Configurar estilo
        let fontStyle = '';
        if (formatos.some((f) => f.tipo === 'bold')) fontStyle += 'bold ';
        if (formatos.some((f) => f.tipo === 'italic')) fontStyle += 'italic ';
        fontStyle += `${this.fontSize}px Arial`;

        ctx.font = fontStyle;
        ctx.fillStyle = this.color;

        // Dibujar segmento
        const segmento = linea.texto.substring(currentPos, finSegmento);
        ctx.fillText(segmento, currentX, currentY);

        // Actualizar posición
        currentX += ctx.measureText(segmento).width;
        currentPos = finSegmento;
      }

      currentY += this.fontSize + 4;
    }

    // Dibujar bordes de selección si está seleccionado
    if (this.seleccionado) {
      const altoTotal = lineas.length * (this.fontSize + 4);
      ctx.strokeStyle = '#000000cc';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        this.x - 5,
        this.y - this.fontSize,
        this.ancho + 10,
        altoTotal + 10
      );

      ctx.fillStyle = 'red';
      ctx.fillRect(this.x + this.ancho + 5, this.y - this.fontSize, 8, 8);
    }
  }

  contienePunto(x, y) {
    const lineHeight = this.fontSize + 4;
    const lineas = this.texto.split('\n').length || 1;
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
  constructor(origen, destino, color = 'black') {
    this.origen = origen;
    this.destino = destino;
    this.color = color;
    this.margenSeguridad = 15; // Espacio alrededor de los objetos
    this.checkpoints = []; // Puntos intermedios para rodear obstáculos
  }

  dibujar(ctx) {
    const { x: x1, y: y1 } = this.calcularPuntoConexion(
      this.origen,
      this.destino
    );
    const { x: x2, y: y2 } = this.calcularPuntoConexion(
      this.destino,
      this.origen
    );

    this.checkpoints = this.calcularRutaOptima(x1, y1, x2, y2);

    // Dibujar la flecha con curvas Bézier mejoradas
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.checkpoints[0].x, this.checkpoints[0].y);

    // Para caminos con pocos puntos, usar línea recta
    if (this.checkpoints.length <= 3) {
      ctx.lineTo(
        this.checkpoints[this.checkpoints.length - 1].x,
        this.checkpoints[this.checkpoints.length - 1].y
      );
    } else {
      // Usar curvas Bézier para caminos más complejos
      let i = 1;
      while (i < this.checkpoints.length - 1) {
        const next =
          i + 1 < this.checkpoints.length ? this.checkpoints[i + 1] : null;

        if (next && i + 2 < this.checkpoints.length) {
          // Curva suave que pasa por el punto medio
          const cp1 = {
            x: (this.checkpoints[i].x + next.x) / 2,
            y: (this.checkpoints[i].y + next.y) / 2,
          };
          ctx.quadraticCurveTo(
            this.checkpoints[i].x,
            this.checkpoints[i].y,
            cp1.x,
            cp1.y
          );
          i += 1;
        } else {
          // Último segmento recto
          ctx.lineTo(this.checkpoints[i].x, this.checkpoints[i].y);
          i++;
        }
      }
    }

    ctx.stroke();

    // Dibujar punta de flecha si hay al menos 2 puntos
    if (this.checkpoints.length >= 2) {
      const ultimoSegmento = this.checkpoints.slice(-2);
      this.dibujarPunta(
        ctx,
        ultimoSegmento[0].x,
        ultimoSegmento[0].y,
        ultimoSegmento[1].x,
        ultimoSegmento[1].y
      );
    }

    // Resaltar si está seleccionada
    if (this.seleccionado) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.checkpoints[0].x, this.checkpoints[0].y);
      for (let i = 1; i < this.checkpoints.length; i++) {
        ctx.lineTo(this.checkpoints[i].x, this.checkpoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  conectaA(objeto) {
    return this.origen === objeto || this.destino === objeto;
  }
  // Modificar el método calcularRutaOptima
  calcularRutaOptima(x1, y1, x2, y2) {
    const gridSize = 20; // Aumentar tamaño de celda para menos puntos
    const maxIterations = 500; // Reducir iteraciones para evitar zig-zags

    // Nodos inicial y final
    const startNode = {
      x: Math.round(x1 / gridSize) * gridSize,
      y: Math.round(y1 / gridSize) * gridSize,
      g: 0,
      h: this.heuristic(x1, y1, x2, y2),
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    const endNode = {
      x: Math.round(x2 / gridSize) * gridSize,
      y: Math.round(y2 / gridSize) * gridSize,
    };

    // Listas abierta y cerrada
    const openList = [startNode];
    const closedList = [];

    let currentNode = null;
    let iterations = 0;

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++;

      // Ordenar y tomar el nodo con menor f
      openList.sort((a, b) => a.f - b.f);
      currentNode = openList.shift();

      // Verificar si llegamos al destino
      if (
        this.puntosCercanos(
          currentNode.x,
          currentNode.y,
          endNode.x,
          endNode.y,
          gridSize
        )
      ) {
        return this.reconstruirYSuavizarCamino(currentNode);
      }

      closedList.push(currentNode);

      // Generar vecinos con preferencia a movimientos rectos
      const vecinos = this.generarVecinosOptimizados(
        currentNode,
        gridSize,
        endNode
      );

      for (const vecino of vecinos) {
        // Saltar si está en lista cerrada o es obstáculo
        if (
          closedList.some((n) => n.x === vecino.x && n.y === vecino.y) ||
          this.puntoDentroDeObstaculo(vecino.x, vecino.y)
        ) {
          continue;
        }

        // Calcular costos
        const gTentativo =
          currentNode.g + this.distanciaEntrePuntos(currentNode, vecino);

        // Buscar en lista abierta
        const nodoAbierto = openList.find(
          (n) => n.x === vecino.x && n.y === vecino.y
        );

        if (!nodoAbierto || gTentativo < nodoAbierto.g) {
          const nuevoVecino = nodoAbierto || { ...vecino, parent: currentNode };
          nuevoVecino.g = gTentativo;
          nuevoVecino.h = this.heuristic(
            nuevoVecino.x,
            nuevoVecino.y,
            endNode.x,
            endNode.y
          );
          nuevoVecino.f = nuevoVecino.g + nuevoVecino.h;

          if (!nodoAbierto) {
            openList.push(nuevoVecino);
          }
        }
      }
    }

    // Fallback: línea recta si no se encontró camino
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }
  // Función heurística (distancia euclidiana)
  heuristic(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  // Nuevo método para generar vecinos con preferencia a movimientos rectos
  generarVecinosOptimizados(nodo, gridSize, endNode) {
    const direcciones = [];
    const dx = endNode.x - nodo.x;
    const dy = endNode.y - nodo.y;

    // Priorizar dirección hacia el destino
    if (Math.abs(dx) > Math.abs(dy)) {
      direcciones.push(
        { dx: Math.sign(dx) * gridSize, dy: 0, bonus: -10 }, // Movimiento principal
        { dx: 0, dy: Math.sign(dy) * gridSize, bonus: -5 }, // Movimiento secundario
        { dx: -Math.sign(dx) * gridSize, dy: 0 }, // Movimiento opuesto
        { dx: 0, dy: -Math.sign(dy) * gridSize }
      );
    } else {
      direcciones.push(
        { dx: 0, dy: Math.sign(dy) * gridSize, bonus: -10 },
        { dx: Math.sign(dx) * gridSize, dy: 0, bonus: -5 },
        { dx: 0, dy: -Math.sign(dy) * gridSize },
        { dx: -Math.sign(dx) * gridSize, dy: 0 }
      );
    }

    // Añadir diagonales con menor prioridad
    direcciones.push(
      { dx: Math.sign(dx) * gridSize, dy: Math.sign(dy) * gridSize },
      { dx: Math.sign(dx) * gridSize, dy: -Math.sign(dy) * gridSize },
      { dx: -Math.sign(dx) * gridSize, dy: Math.sign(dy) * gridSize },
      { dx: -Math.sign(dx) * gridSize, dy: -Math.sign(dy) * gridSize }
    );

    return direcciones.map((dir) => ({
      x: nodo.x + dir.dx,
      y: nodo.y + dir.dy,
      bonus: dir.bonus || 0,
    }));
  }
  // Método mejorado para reconstruir y suavizar el camino
  reconstruirYSuavizarCamino(nodoFinal) {
    const camino = [];
    let currentNode = nodoFinal;

    // Reconstruir camino
    while (currentNode) {
      camino.unshift({ x: currentNode.x, y: currentNode.y });
      currentNode = currentNode.parent;
    }

    // Simplificar eliminando nodos innecesarios
    const simplificado = [camino[0]];
    for (let i = 1; i < camino.length - 1; i++) {
      const prev = simplificado[simplificado.length - 1];
      const current = camino[i];
      const next = camino[i + 1];

      // Calcular ángulos
      const ang1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const ang2 = Math.atan2(next.y - current.y, next.x - current.x);

      // Si el cambio de dirección es significativo (> 20 grados), mantener el punto
      if (Math.abs(ang1 - ang2) > 0.35) {
        // ~20 grados en radianes
        simplificado.push(current);
      }
    }
    simplificado.push(camino[camino.length - 1]);

    return simplificado;
  }
  // generarVecinos(nodo, gridSize, endNode) {
  //   const vecinos = [];
  //   const directions = [
  //     { dx: 0, dy: -gridSize }, // arriba
  //     { dx: gridSize, dy: 0 }, // derecha
  //     { dx: 0, dy: gridSize }, // abajo
  //     { dx: -gridSize, dy: 0 }, // izquierda
  //     { dx: gridSize, dy: -gridSize }, // arriba-derecha
  //     { dx: gridSize, dy: gridSize }, // abajo-derecha
  //     { dx: -gridSize, dy: gridSize }, // abajo-izquierda
  //     { dx: -gridSize, dy: -gridSize }, // arriba-izquierda
  //   ];

  //   for (const dir of directions) {
  //     const x = nodo.x + dir.dx;
  //     const y = nodo.y + dir.dy;

  //     // Pequeña optimización: si el vecino está en línea recta con el destino, darle prioridad
  //     const enLineaRecta =
  //       (x === nodo.x && x === endNode.x) ||
  //       (y === nodo.y && y === endNode.y) ||
  //       Math.abs(
  //         (y - nodo.y) / (x - nodo.x) - (endNode.y - y) / (endNode.x - x)
  //       ) < 0.1;

  //     vecinos.push({
  //       x,
  //       y,
  //       bonus: enLineaRecta ? -5 : 0, // Pequeño bonus para nodos en línea recta con el destino
  //     });
  //   }

  //   return vecinos;
  // }
  // Reconstruir el camino desde el nodo final
  reconstruirCamino(nodoFinal) {
    const camino = [];
    let currentNode = nodoFinal;

    while (currentNode) {
      camino.unshift({ x: currentNode.x, y: currentNode.y });
      currentNode = currentNode.parent;
    }

    // Simplificar el camino eliminando nodos redundantes
    return this.simplificarCamino(camino);
  }

  // Simplificar el camino eliminando puntos innecesarios
  simplificarCamino(camino) {
    if (camino.length <= 2) return camino;

    const simplified = [camino[0]];
    let lastDirection = null;

    for (let i = 1; i < camino.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const current = camino[i];
      const next = camino[i + 1];

      // Calcular direcciones
      const dirCurrent = {
        dx: current.x - prev.x,
        dy: current.y - prev.y,
      };

      const dirNext = {
        dx: next.x - current.x,
        dy: next.y - current.y,
      };

      // Si la dirección cambia, mantener el punto actual
      if (dirCurrent.dx !== dirNext.dx || dirCurrent.dy !== dirNext.dy) {
        simplified.push(current);
      }
    }

    simplified.push(camino[camino.length - 1]);
    return simplified;
  }
  puntosCercanos(x1, y1, x2, y2, umbral) {
    return Math.abs(x1 - x2) < umbral && Math.abs(y1 - y2) < umbral;
  }

  calcularPuntosRodeo(puntoActual, obstaculo, xDest, yDest) {
    const { x: ox, y: oy, ancho, alto } = obstaculo;
    const margen = this.margenSeguridad;
    const puntos = [];

    // Calcular límites extendidos del obstáculo
    const izquierda = ox - margen;
    const derecha = ox + ancho + margen;
    const arriba = oy - margen;
    const abajo = oy + alto + margen;

    // Determinar dirección general del flujo
    const direccionX = xDest > puntoActual.x ? 1 : -1;
    const direccionY = yDest > puntoActual.y ? 1 : -1;

    // Generar posibles puntos de rodeo
    const opciones = [];

    // Puntos cardinales alrededor del obstáculo
    opciones.push({ x: izquierda, y: arriba }); // Esquina superior izquierda
    opciones.push({ x: derecha, y: arriba }); // Esquina superior derecha
    opciones.push({ x: izquierda, y: abajo }); // Esquina inferior izquierda
    opciones.push({ x: derecha, y: abajo }); // Esquina inferior derecha

    // Puntos intermedios en los lados
    opciones.push({ x: ox + ancho / 2, y: arriba }); // Centro arriba
    opciones.push({ x: ox + ancho / 2, y: abajo }); // Centro abajo
    opciones.push({ x: izquierda, y: oy + alto / 2 }); // Centro izquierda
    opciones.push({ x: derecha, y: oy + alto / 2 }); // Centro derecha

    // Filtrar puntos que estén dentro de otros obstáculos
    const puntosValidos = opciones.filter(
      (p) => !this.puntoDentroDeObstaculo(p.x, p.y)
    );

    if (puntosValidos.length === 0) return [];

    // Seleccionar el punto que más acerque al destino
    puntosValidos.sort((a, b) => {
      const distA = this.distanciaEntrePuntos(a, { x: xDest, y: yDest });
      const distB = this.distanciaEntrePuntos(b, { x: xDest, y: yDest });
      return distA - distB;
    });

    const mejorPunto = puntosValidos[0];

    // Calcular punto intermedio si es necesario para evitar ángulos muy agudos
    if (
      Math.abs(puntoActual.x - mejorPunto.x) >
      Math.abs(puntoActual.y - mejorPunto.y)
    ) {
      // Mover primero horizontalmente
      puntos.push({ x: mejorPunto.x, y: puntoActual.y });
    } else {
      // Mover primero verticalmente
      puntos.push({ x: puntoActual.x, y: mejorPunto.y });
    }

    puntos.push(mejorPunto);

    return puntos;
  }

  // Generar vecinos (8 direcciones)
  generarVecinos(nodo, gridSize, endNode) {
    const vecinos = [];
    const directions = [
      { dx: 0, dy: -gridSize }, // arriba
      { dx: gridSize, dy: 0 }, // derecha
      { dx: 0, dy: gridSize }, // abajo
      { dx: -gridSize, dy: 0 }, // izquierda
      { dx: gridSize, dy: -gridSize }, // arriba-derecha
      { dx: gridSize, dy: gridSize }, // abajo-derecha
      { dx: -gridSize, dy: gridSize }, // abajo-izquierda
      { dx: -gridSize, dy: -gridSize }, // arriba-izquierda
    ];

    for (const dir of directions) {
      const x = nodo.x + dir.dx;
      const y = nodo.y + dir.dy;

      // Pequeña optimización: si el vecino está en línea recta con el destino, darle prioridad
      const enLineaRecta =
        (x === nodo.x && x === endNode.x) ||
        (y === nodo.y && y === endNode.y) ||
        Math.abs(
          (y - nodo.y) / (x - nodo.x) - (endNode.y - y) / (endNode.x - x)
        ) < 0.1;

      vecinos.push({
        x,
        y,
        bonus: enLineaRecta ? -5 : 0, // Pequeño bonus para nodos en línea recta con el destino
      });
    }

    return vecinos;
  }

  calcularPuntoConexion(objeto, otroObjeto) {
    const dx = otroObjeto.x - objeto.x;
    const dy = otroObjeto.y - objeto.y;
    const angulo = Math.atan2(dy, dx);

    // Para círculos
    if (objeto instanceof Circulo) {
      const r = objeto.radio + this.margenSeguridad / 2;
      return {
        x: objeto.x + r * Math.cos(angulo),
        y: objeto.y + r * Math.sin(angulo),
      };
    }

    // Para componentes de texto
    if (
      objeto instanceof Texto ||
      (objeto instanceof Componente && objeto.hijos)
    ) {
      // Calcular punto de conexión en el borde del rectángulo
      const ancho = objeto.ancho || 0;
      const altura =
        objeto instanceof Texto
          ? objeto.fontSize * (objeto.texto.split('\n').length || 1)
          : this.calcularAlturaComponente(objeto);

      // Calcular intersección con el rectángulo
      const mitadAncho = ancho / 2;
      const mitadAltura = altura / 2;

      // Calcular proporciones para encontrar el punto de intersección
      const ratioX = mitadAncho / Math.abs(Math.cos(angulo));
      const ratioY = mitadAltura / Math.abs(Math.sin(angulo));
      const ratio = Math.min(ratioX, ratioY);

      return {
        x: objeto.x + mitadAncho + ratio * Math.cos(angulo),
        y: objeto.y + mitadAltura + ratio * Math.sin(angulo),
      };
    }

    // Por defecto, usar el centro del objeto
    return { x: objeto.x, y: objeto.y };
  }

  calcularAlturaComponente(componente) {
    if (!componente.hijos || componente.hijos.length === 0) return 0;
    const ultimoHijo = componente.hijos[componente.hijos.length - 1];
    return ultimoHijo.y - componente.y + ultimoHijo.fontSize;
  }
  detectarObstaculos(x1, y1, x2, y2) {
    const margen = this.margenSeguridad;
    const minX = Math.min(x1, x2) - margen;
    const maxX = Math.max(x1, x2) + margen;
    const minY = Math.min(y1, y2) - margen;
    const maxY = Math.max(y1, y2) + margen;

    const obstaculos = [];

    for (const obj of MiniFigma.instance.state.objetos) {
      if (obj === this.origen || obj === this.destino) continue;

      let ox, oy, ancho, alto;

      if (obj instanceof Circulo) {
        ox = obj.x - obj.radio - margen;
        oy = obj.y - obj.radio - margen;
        ancho = obj.radio * 2 + margen * 2;
        alto = obj.radio * 2 + margen * 2;
      } else if (obj instanceof Texto) {
        const lineas = obj.texto.split('\n').length || 1;
        ox = obj.x - margen;
        oy = obj.y - obj.fontSize - margen;
        ancho = obj.ancho + margen * 2;
        alto = (obj.fontSize + 4) * lineas + margen * 2;
      } else if (obj instanceof Componente) {
        const ultimoHijo = obj.hijos[obj.hijos.length - 1];
        const lineas = ultimoHijo.texto.split('\n').length || 1;
        ox = obj.x - margen;
        oy = obj.y - margen;
        ancho = obj.ancho + margen * 2;
        alto =
          ultimoHijo.y -
          obj.y +
          (ultimoHijo.fontSize + 4) * lineas +
          margen * 2;
      }

      // Verificar si el área del objeto intersecta con el área de la flecha
      if (ox + ancho > minX && ox < maxX && oy + alto > minY && oy < maxY) {
        // Verificar si realmente está en la línea entre origen y destino
        if (
          this.lineaIntersectaObjeto(x1, y1, x2, y2, {
            x: ox,
            y: oy,
            ancho,
            alto,
          })
        ) {
          obstaculos.push({ x: ox, y: oy, ancho, alto, objeto: obj });
        }
      }
    }

    return obstaculos;
  }

  lineaIntersectaObjeto(x1, y1, x2, y2, objeto) {
    // Coordenadas del objeto
    const left = objeto.x;
    const right = objeto.x + objeto.ancho;
    const top = objeto.y;
    const bottom = objeto.y + objeto.alto;

    // Algoritmo de Liang-Barsky para clip de líneas
    let t0 = 0;
    let t1 = 1;
    const dx = x2 - x1;
    const dy = y2 - y1;

    const p = [-dx, dx, -dy, dy];
    const q = [x1 - left, right - x1, y1 - top, bottom - y1];

    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false; // Línea paralela y fuera del borde
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }

    return t0 < t1; // Hay intersección si t0 < t1
  }

  // En la clase Flecha, modificar el método puntoDentroDeObstaculo
  puntoDentroDeObstaculo(x, y) {
    // Margen más generoso para evitar rozar objetos
    const margen = this.margenSeguridad * 1.5;

    // Verificar objetos conectados primero
    if (this.origen instanceof Circulo) {
      if (
        Math.hypot(x - this.origen.x, y - this.origen.y) <
        this.origen.radio + margen
      ) {
        return false;
      }
    }

    if (this.destino instanceof Circulo) {
      if (
        Math.hypot(x - this.destino.x, y - this.destino.y) <
        this.destino.radio + margen
      ) {
        return false;
      }
    }

    // Verificar otros obstáculos
    for (const obj of MiniFigma.instance.state.objetos) {
      if (obj === this.origen || obj === this.destino) continue;

      if (obj instanceof Circulo) {
        if (Math.hypot(x - obj.x, y - obj.y) < obj.radio + margen) {
          return true;
        }
      } else {
        let ox, oy, ancho, alto;

        if (obj instanceof Texto) {
          const lineas = obj.texto.split('\n').length || 1;
          ox = obj.x - margen;
          oy = obj.y - obj.fontSize - margen;
          ancho = obj.ancho + margen * 2;
          alto = (obj.fontSize + 4) * lineas + margen * 2;
        } else if (obj instanceof Componente) {
          const ultimoHijo = obj.hijos[obj.hijos.length - 1];
          const lineas = ultimoHijo.texto.split('\n').length || 1;
          ox = obj.x - margen;
          oy = obj.y - margen;
          ancho = obj.ancho + margen * 2;
          alto =
            ultimoHijo.y -
            obj.y +
            (ultimoHijo.fontSize + 4) * lineas +
            margen * 2;
        }

        if (x >= ox && x <= ox + ancho && y >= oy && y <= oy + alto) {
          return true;
        }
      }
    }
    return false;
  }

  dibujarPunta(ctx, x1, y1, x2, y2) {
    const angulo = Math.atan2(y2 - y1, x2 - x1);
    const tamañoFlecha = 10;

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - tamañoFlecha * Math.cos(angulo - Math.PI / 6),
      y2 - tamañoFlecha * Math.sin(angulo - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - tamañoFlecha * Math.cos(angulo + Math.PI / 6),
      y2 - tamañoFlecha * Math.sin(angulo + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  puntoCercaDeDestino(punto, xDest, yDest, umbral = 5) {
    return Math.hypot(punto.x - xDest, punto.y - yDest) < umbral;
  }

  distanciaEntrePuntos(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  contienePunto() {
    return false;
  }
  conectaA(objeto) {
    return this.origen === objeto || this.destino === objeto;
  }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  MiniFigma.instance = new MiniFigma();
});
