function cambiarMarcador() {
    var spnMarcador = document.getElementById("sp_nombreConsulta");
    var lblConsulta = document.getElementById("lb_consulta");
    var txtMarcador = document.createElement("input");
    txtMarcador.setAttribute("type", "text");
    txtMarcador.setAttribute("id", "in_nombre");
    txtMarcador.setAttribute("placeholder", "Ingrese un nombre");
    txtMarcador.setAttribute("maxlength", "32");
    spnMarcador.replaceChild(txtMarcador, lblConsulta);
    txtMarcador.focus();

    var btnConsultar = document.getElementById("bt_consultar");
    btnConsultar.setAttribute("value", "Aceptar");
    btnConsultar.onclick = crearMarcador;
    var btnAgregar = document.getElementById("bt_agregar");
    btnAgregar.setAttribute("value", "Cancelar");
    btnAgregar.onclick = cancelarMarcador;
}

function cancelarMarcador() {
    var spnMarcador = document.getElementById("sp_nombreConsulta");
    var txtMarcador = document.getElementById("in_nombre");
    var lblConsulta = document.createElement("label");
    lblConsulta.setAttribute("id", "lb_consulta");
    lblConsulta.innerHTML = "Consultar parada:";
    spnMarcador.replaceChild(lblConsulta, txtMarcador);

    var btnConsultar = document.getElementById("bt_consultar");
    btnConsultar.setAttribute("value", "Consultar");
    btnConsultar.onclick = hacerConsulta;
    var btnAgregar = document.getElementById("bt_agregar");
    btnAgregar.setAttribute("value", "Agregar");
    btnAgregar.onclick = cambiarMarcador;
}

function hacerConsulta(event) {
    var datos = event.target.getAttribute("data-parada");
    if (!datos) {
        var parada = document.getElementById("in_parada").value;
        var linea = document.getElementById("sl_linea").value;
    } else {
        var marcador = JSON.parse(localStorage.getItem(datos));
        var parada = marcador.parada;
        var linea = marcador.linea;
    }
    try {
        if (!linea || linea.length===0)
            throw "Debe ingresar la línea de colectivo.";
        if (!/^\d{5}$/.test(parada))
            throw "Debe ingresar una parada conformada por 5 dígitos.";
        var url = "coleapi/parada/"+parada;
        if (linea !== "Todas") {
            url += "/linea/"+linea;
        }
        enviarSolicitud("GET", url, null, obtenerDatosParada);
    } catch(err) {
        alert("Error: "+err);
    }
}

function crearMarcador() {
    var nombre = document.getElementById("in_nombre").value;
    var parada = document.getElementById("in_parada").value;
    var linea = document.getElementById("sl_linea").value;
    try {
        if (!nombre || nombre.length===0)
            throw "Debe ingresar un nombre para el marcador.";
        if (!linea || linea.length===0)
            throw "Debe ingresar la línea de colectivo.";
        if (!/^\d{5}$/.test(parada))
            throw "Debe ingresar una parada conformada por 5 dígitos.";

        var fecha = new Date();
        var key = "parada_" + fecha.getTime();
        var marcador = {
            "nombre": nombre,
            "parada": parada,
            "linea": linea
        };
        almacenarMarcador(key, marcador);
        addParadaToDOM(key, marcador);
        cancelarMarcador();
    } catch(err) {
        alert("Error: "+err);
    }
}

function borrarMarcador(event) {
    if (confirm("¿Está seguro de borrar este marcador?")) {
        var key = event.target.getAttribute("data-parada");
        removerMarcador(key);
        removeParadaFromDOM(key);
    }
}

function iniciarImportar() {
    accionPerfil(importarMarcadores, "Ingrese el nombre del perfil a descargar");
}

function iniciarExportar() {
    accionPerfil(exportarMarcadores, "Ingrese un nombre que identifique al perfil");
}

function accionPerfil(accion, textoAyuda) {
    var spnPerfil = document.getElementById("sp_botonesPerfil");
    var txtPerfil = document.createElement("input");
    txtPerfil.setAttribute("type", "text");
    txtPerfil.setAttribute("id", "in_perfil");
    txtPerfil.setAttribute("placeholder", textoAyuda);
    txtPerfil.setAttribute("maxlength", "16");
    spnPerfil.insertBefore(txtPerfil, spnPerfil.firstChild);
    var btnAceptar = document.getElementById("bt_importar");
    btnAceptar.setAttribute("value", "Aceptar");
    btnAceptar.onclick = accion;
    var btnCancelar = document.getElementById("bt_exportar");
    btnCancelar.setAttribute("value", "Cancelar");
    btnCancelar.onclick = cancelarPerfil;
    txtPerfil.focus();
}

function cancelarPerfil() {
    var spnPerfil = document.getElementById("sp_botonesPerfil");
    var txtPerfil = document.getElementById("in_perfil");
    spnPerfil.removeChild(txtPerfil);
    var btnAceptar = document.getElementById("bt_importar");
    btnAceptar.setAttribute("value", "Importar");
    btnAceptar.onclick = iniciarImportar;
    var btnCancelar = document.getElementById("bt_exportar");
    btnCancelar.setAttribute("value", "Exportar");
    btnCancelar.onclick = iniciarExportar;
}

function importarMarcadores() {
    var perfil = document.getElementById("in_perfil").value;
    if (perfil && perfil.length>0) {
        if ((getParadasArray().length == 0) || confirm("¿Está seguro? Se perderán los marcadores actuales.")) {
            cancelarPerfil();
            var url = "coleapi/perfil/"+perfil;
            enviarSolicitud("GET", url, null, obtenerPerfil);
        }
    }
}

function exportarMarcadores() {
    var perfil = document.getElementById("in_perfil").value;
    if (perfil && perfil.length>0) {
        cancelarPerfil();
        var paqueteArray = {};
        var paradasArray = getParadasArray();
        for (var i in paradasArray) {
            paqueteArray[paradasArray[i]] = JSON.parse(localStorage.getItem(paradasArray[i]));
        }
        var url = "coleapi/perfil/"+perfil;
        enviarSolicitud("PUT", url, JSON.stringify(paqueteArray), publicarPerfil);
    }
}
