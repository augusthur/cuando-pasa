window.onload = init;

function init() {
    var btnAgregar = document.getElementById("bt_agregar");
    btnAgregar.onclick = cambiarMarcador;
    var btnConsultar = document.getElementById("bt_consultar");
    btnConsultar.onclick = hacerConsulta;
    var btnImportar = document.getElementById("bt_importar");
    btnImportar.onclick = iniciarImportar;
    var btnExportar = document.getElementById("bt_exportar");
    btnExportar.onclick = iniciarExportar;

    var paradasArray = getParadasArray();
    for (var i in paradasArray) {
        var key = paradasArray[i];
        var value = JSON.parse(localStorage.getItem(key));
        addParadaToDOM(key, value);
    }
}

function obtenerDatosParada(peticion) {
    if (peticion.status == 200) {
        alert(peticion.responseText);
    } else {
        alert("Error: "+peticion.responseText);
    }
}

function obtenerPerfil(peticion) {
    if (peticion.status == 200) {
        var paradasArray = getParadasArray();
        for (var i in paradasArray) {
            removerMarcador(paradasArray[i]);
            removeParadaFromDOM(paradasArray[i]);
        }
        var marcadores = JSON.parse(peticion.responseText);
        for (var i in marcadores) {
            var key = i;
            var marcador = marcadores[i];
            almacenarMarcador(key, marcador);
            addParadaToDOM(key, marcador);
        }
    } else {
        alert("Error: "+peticion.responseText);
    }
}

function publicarPerfil(peticion) {
    if (peticion.status == 200) {
        alert("Perfil exportado satisfactoriamente.");
    } else {
        alert("Error: "+peticion.responseText);
    }
}
