<?php
require 'Slim/Slim.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->container->singleton('db', function () {
    $db = new PDO('mysql:host=localhost;dbname=DBNAME', 'USER', 'PASSWORD');
    $db->query("SET NAMES 'utf8'");
    return $db;
});

function cuandoPasa($peticion, $recurso = '') {
    $c = curl_init();
    curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($c, CURLOPT_CUSTOMREQUEST, 'HEAD');
    curl_setopt($c, CURLOPT_HEADER, true);
    curl_setopt($c, CURLOPT_NOBODY, true);
    curl_setopt($c, CURLOPT_USERAGENT, 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:26.0) Gecko/20100101 Firefox/25.0');
    curl_setopt($c, CURLOPT_URL, 'http://cuandopasa.efibus.com.ar/');
    $res = curl_exec($c);
    preg_match('/^Set-Cookie:\s*([^;]*)/mi', $res, $m);
    $cookie = $m[1];
    $encabezados = array(
        'Content-Type: application/json; charset=utf-8',
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: es-ar,es;q=0.8,en-us;q=0.5,en;q=0.3',
        'Accept-Encoding: gzip, deflate',
        'X-Requested-With: XMLHttpRequest',
        'Referer: http://cuandopasa.efibus.com.ar/',
        'Connection: keep-alive',
        'Host: cuandopasa.efibus.com.ar',
        'Pragma: no-cache',
        'Cache-Control: no-cache',
    );
    $c = curl_init();
    curl_setopt($c, CURLOPT_POST, true);
    curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($c, CURLOPT_HEADER, false);
    curl_setopt($c, CURLOPT_HTTPHEADER, $encabezados);
    curl_setopt($c, CURLOPT_COOKIE, $cookie);
    curl_setopt($c, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; rv:25.0) Gecko/20100101 Firefox/25.0');
    curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($peticion));
    curl_setopt($c, CURLOPT_URL, 'http://cuandopasa.efibus.com.ar/default.aspx/RecuperarDatosDeParada' . $recurso);
    curl_setopt($c, CURLOPT_TIMEOUT, 3);
    $res = json_decode(curl_exec($c));
    if ($res && property_exists($res, 'd')) {
        foreach ($res->d as $parada) {
            echo $parada->datosMostrar . "\n";
        }
    } else {
        echo "La consulta no generó respuesta. Compruebe el número de parada.";
    }
}

function isParada($parada) {
    return preg_match('/^\d{5}$/', $parada);
}

function isLinea($linea, $incluirTodas = false) {
    $lineas = array("1", "2", "3", "4", "5", "8", "9", "9C", "10", "11", "13", "14", "15", "16", "18");
    if ($incluirTodas) {
        $lineas[] = "Todas";
    }
    return in_array($linea, $lineas);
}

function isNombre($nombre) {
    return preg_match('/^[a-zA-Z0-9\., ÑÁÉÍÓÚñáéíóú]{1,32}$/', $nombre);
}

function isKey($key) {
    return preg_match('/^parada_(\d{1,17})$/', $key);
}

function isPerfil($perfil) {
    return ctype_alnum(str_replace('_', '', $perfil)) && (strlen($perfil) <= 16);
}

$app->get('/parada/:idParada/linea/:idLinea', 'getParadaLinea');
function getParadaLinea($idParada, $idLinea) {
    global $app;
    if (!isParada($idParada)) {
        $app->halt(400, 'El número de parada es inválido.');
    }
    if (!isLinea($idLinea)) {
        $app->halt(404, 'No existe esa línea.');
    }
    $cuerpo = array(
        "identificadorParada" => $idParada,
        "descricionLinea" => $idLinea,
    );
    cuandoPasa($cuerpo, 'PorLinea');
}

$app->get('/parada/:idParada', 'getParada');
function getParada($idParada) {
    global $app;
    if (!isParada($idParada)) {
        $app->halt(400, 'El número de parada es inválido.');
    }
    $cuerpo = array(
        "identificadorParada" => $idParada,
    );
    cuandoPasa($cuerpo);
}

$app->get('/perfil/:nombrePerfil', 'getPerfil');
function getPerfil($nombrePerfil) {
    global $app;
    if (!isPerfil($nombrePerfil)) {
        $app->halt(400, 'El nombre del perfil es inválido.');
    }
    $nombrePerfil = strtolower($nombrePerfil);
    try {
        $db = $app->db;
        $statement = $db->prepare("SELECT id_perfil FROM perfil WHERE nombre=?");
        $statement->execute(array($nombrePerfil));
        if (!$statement->rowCount()) {
            throw new Exception('El perfil ' . $nombrePerfil . ' no existe.');
        }
        $idPerfil = $statement->fetchColumn();

        $statement = $db->prepare("SELECT * FROM marcador WHERE id_perfil=?");
        $statement->execute(array($idPerfil));
        $retorno = array();
        while ($fila = $statement->fetch(PDO::FETCH_ASSOC)) {
            $retorno[$fila["clave"]] = array(
                "nombre" => $fila["nombre"],
                "parada" => $fila["parada"],
                "linea" => $fila["linea"]
            );
        }
        $statement = null;
        $db = null;
        $response = $app->response();
        $response->headers->set('Content-Type', 'application/json; charset=utf-8');
        $response->status(200);
        echo json_encode($retorno);
    } catch (PDOException $e) {
        $app->halt(500, "No se puede acceder a la base de datos.");
    } catch (Exception $e) {
        $app->halt(404, $e->getMessage());
    }
}

$app->put('/perfil/:nombrePerfil', 'putPerfil');
function putPerfil($nombrePerfil) {
    global $app;
    if (!isPerfil($nombrePerfil)) {
        $app->halt(400, 'El nombre del perfil es inválido.');
    }
    $nombrePerfil = strtolower($nombrePerfil);

    $paquete = json_decode($app->request()->getBody(), true);
    foreach ($paquete as $key => $value) {
        if (!isKey($key) || !isNombre($value['nombre']) || !isParada($value['parada']) || !isLinea($value['linea'], true)) {
            $app->halt(400, 'Los marcadores a exportar no son válidos.');
        }
    }
    try {
        $db = $app->db;
        $statement = $db->prepare("SELECT id_perfil FROM perfil WHERE nombre=?");
        $statement->execute(array($nombrePerfil));
        if (!$statement->rowCount()) {
            $statement = $db->prepare("INSERT INTO perfil (nombre) VALUES (?)");
            $statement->execute(array($nombrePerfil));
            $idPerfil = $db->lastInsertId();
        } else {
            $idPerfil = $statement->fetchColumn();
        }

        $statement = $db->prepare("SELECT id_marcador, clave FROM marcador WHERE id_perfil=?");
        $statement->execute(array($idPerfil));
        $borrables = array();
        while ($fila = $statement->fetch(PDO::FETCH_ASSOC)) {
            if (array_key_exists($fila['clave'], $paquete)) {
                unset($paquete[$fila['clave']]);
            } else {
                $borrables[] = $fila['id_marcador'];
            }
        }
        foreach ($borrables as $idBorrar) {
            $statement = $db->prepare("DELETE FROM marcador WHERE id_marcador=?");
            $statement->execute(array($idBorrar));
        }
        foreach ($paquete as $key => $value) {
            $statement = $db->prepare("INSERT INTO marcador (clave, nombre, parada, linea, id_perfil) VALUES (?, ?, ?, ?, ?)");
            $statement->execute(array($key, $value['nombre'], $value['parada'], $value['linea'], $idPerfil));
        }

        $statement = null;
        $db = null;
        $response = $app->response();
        $response->status(200);
    } catch (PDOException $e) {
        $app->halt(500, "No se puede acceder a la base de datos.");
    }
}

$app->options('/parada/:idParada+', 'allowCORS');
function allowCORS($idParada) {
    global $app;
    $origen = $app->request->headers->get('Origin');
    $response = $app->response();
    $response->status(200);
    $response->headers->set('Access-Control-Allow-Origin', $origen);
    $response->headers->set('Access-Control-Request-Method', 'GET');
    $response->headers->set('Access-Control-Max-Age', '86400');
}

$app->get('/', 'bienvenida');
function bienvenida() {
    $template = <<<EOT
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Bienvenido a ColeAPI</title>
    </head>
    <body>
        <h2>Los mensajes actualmente disponibles son:</h2>
        <ul>
            <li>GET /parada/{idParada}</li>
            <li>GET /parada/{idParada}/linea/{nroLinea}</li>
            <li>GET /perfil/{nombrePerfil}</li>
            <li>PUT /perfil/{nombrePerfil}</li>
        </ul>
    </body>
</html>
EOT;
    echo $template;
}

$app->run();
?>
