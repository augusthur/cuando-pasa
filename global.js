function getParadasArray() {
    var retorno = new Array();
    var paradasArray = localStorage.getItem("paradasArray");
    if (!paradasArray) {
        localStorage.setItem("paradasArray", JSON.stringify(retorno));
    } else {
        retorno = JSON.parse(paradasArray);
    }
    return retorno;
}

function almacenarMarcador(key, marcador) {
    localStorage.setItem(key, JSON.stringify(marcador));
    var paradasArray = getParadasArray();
    paradasArray.push(key);
    localStorage.setItem("paradasArray", JSON.stringify(paradasArray));
}

function removerMarcador(key) {
    localStorage.removeItem(key);
    var paradasArray = getParadasArray();
    for (var i in paradasArray) {
        if (key == paradasArray[i]) {
            paradasArray.splice(i,1);
        }
    }
    localStorage.setItem("paradasArray", JSON.stringify(paradasArray));
}

function enviarSolicitud(metodo, url, cuerpo, accion) {
    var request = new XMLHttpRequest();
    var fecha = new Date();
    url += "?void="+fecha.getTime();
    request.open(metodo, url);
    if (metodo == "PUT") {
         request.setRequestHeader('Content-Type', 'application/json');
    }
    request.timeout = 7500;
    request.onload = function() {
        mostrarPaginaCarga(false);
        accion(request);
    };
    request.ontimeout = function() {
        mostrarPaginaCarga(false);
        alert("El servidor no responde, intente nuevamente.");
    };
    request.onerror = function() {
        mostrarPaginaCarga(false);
    };
    mostrarPaginaCarga(true);
    request.send(cuerpo);
}

/************/

function addParadaToDOM(key, marcador) {
    var lista = document.getElementById("marcadores");
    var nuevoMarcador = document.createElement("li");
    nuevoMarcador.setAttribute("id", key);
    var spnBotones = document.createElement("span");
    spnBotones.setAttribute("class", "botonesParada");
    var spnNombre = document.createElement("span");
    spnNombre.setAttribute("class", "nombreMarcador");
    var spnInfo = document.createElement("span");
    spnInfo.setAttribute("class", "infoMarcador");
    var btnConsultar = document.createElement("input");
    btnConsultar.setAttribute("type", "button");
    btnConsultar.setAttribute("class", "botonIzq");
    btnConsultar.setAttribute("value", "Consultar");
    btnConsultar.setAttribute("data-parada", key);
    btnConsultar.onclick = hacerConsulta;
    var btnBorrar = document.createElement("input");
    btnBorrar.setAttribute("type", "button");
    btnBorrar.setAttribute("class", "botonDer");
    btnBorrar.setAttribute("value", "Borrar");
    btnBorrar.setAttribute("data-parada", key);
    btnBorrar.onclick = borrarMarcador;
    spnNombre.appendChild(document.createTextNode(marcador.nombre));
    spnInfo.appendChild(document.createTextNode(marcador.linea + " | " + marcador.parada));
    spnBotones.appendChild(btnConsultar);
    spnBotones.appendChild(btnBorrar);
    nuevoMarcador.appendChild(spnBotones);
    nuevoMarcador.appendChild(spnNombre);
    nuevoMarcador.appendChild(spnInfo);
    lista.appendChild(nuevoMarcador);
}

function removeParadaFromDOM(key) {
    var parada = document.getElementById(key);
    parada.parentNode.removeChild(parada);
}

function mostrarPaginaCarga(mostrar) {
    var marco = document.getElementById("overlay");
    if (!marco && mostrar) {
        marco = document.createElement("div");
        marco.setAttribute("id", "overlay");
        document.body.appendChild(marco);
    } else {
        document.body.removeChild(marco);
    }
}
