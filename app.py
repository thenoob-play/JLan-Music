import os
import requests
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import yt_dlp
import mysql.connector  # <-- CORREGIDO: Importación real agregada

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# ================== CONFIG ==================
YDL_BASE_OPTS = {
    'quiet': True,
    'nocheckcertificate': True
}

REQUEST_TIMEOUT = 10


# ================== CONEXIÓN A BASE DE DATOS ==================
def get_connection():
    return mysql.connector.connect(
        host="localhost",          # Déjalo en localhost si corre en tu misma PC
        user="root",               # Tu usuario de MySQL (por defecto es root)
        password="noobees07",  # <--- Reemplaza con la contraseña que elegiste al instalar MySQL
        database="jlan"            # El nombre de la base de datos (según tu imagen se llama mydb)
    )


# ================== UTIL ==================
def extraer_videos(info):
    return [{
        "id": v.get("id"),
        "titulo": v.get("title"),
        "url": f"https://www.youtube.com/watch?v={v.get('id')}",
        "thumbnail": f"https://i.ytimg.com/vi/{v.get('id')}/hqdefault.jpg",
        "canal": v.get("uploader") or v.get("channel") 
    } for v in info.get('entries', []) if v and v.get("id")]

def error_response(msg, code=400):
    return jsonify({"error": msg}), code


# ================== INDEX ==================
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


# ================== BUSCAR ==================
@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.get_json(silent=True)

    if not data or not data.get("query"):
        return jsonify([])

    query = data["query"].strip()

    try:
        opciones = {
            **YDL_BASE_OPTS,
            'extract_flat': True,
            'playlistend': 50   
        }

        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(f"ytsearch50:{query}", download=False)

        return jsonify(extraer_videos(info))

    except Exception as e:
        return error_response(f"Error al buscar: {str(e)}", 500)


# ================== TOP ==================
@app.route('/top-canciones')
def top():
    playlist_url = "https://www.youtube.com/playlist?list=PLSYbV1H4VkCdUUgsgAaeRwI5964Lu2ljC"

    try:
        opciones = {
            **YDL_BASE_OPTS,
            'extract_flat': True,
            'playlistend': 40
        }

        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(playlist_url, download=False)

        return jsonify(extraer_videos(info))

    except Exception as e:
        return error_response(f"Error en top canciones: {str(e)}", 500)


# ================== STREAM ==================
@app.route('/stream', methods=['POST'])
def stream():
    data = request.get_json(silent=True)

    if not data or not data.get("url"):
        return error_response("URL no válida")

    try:
        ydl_opts = {
            **YDL_BASE_OPTS,
            'format': 'bestaudio',
            'noplaylist': True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(data["url"], download=False)

        audio_url = info.get('url')

        if not audio_url:
            return error_response("No se pudo obtener el audio", 500)

        return jsonify({
            "audio_url": f"/proxy-audio?url={requests.utils.quote(audio_url)}",
            "titulo": info.get("title", "Sin título"),
            "canal": info.get("uploader") or info.get("channel") 
        })

    except Exception as e:
        return error_response(f"Error en stream: {str(e)}", 500)


# ================== PROXY ==================
@app.route('/proxy-audio')
def proxy_audio():
    url = request.args.get('url')

    if not url:
        return error_response("URL faltante")

    try:
        headers = {}

        if 'Range' in request.headers:
            headers['Range'] = request.headers['Range']

        r = requests.get(url, headers=headers, stream=True, timeout=REQUEST_TIMEOUT)

        def generate():
            for chunk in r.iter_content(chunk_size=64 * 1024):
                if chunk:
                    yield chunk

        response = Response(
            generate(),
            status=r.status_code,
            content_type=r.headers.get('Content-Type', 'audio/mpeg')
        )

        response.headers['Accept-Ranges'] = 'bytes'

        if 'Content-Range' in r.headers:
            response.headers['Content-Range'] = r.headers['Content-Range']

        if 'Content-Length' in r.headers:
            response.headers['Content-Length'] = r.headers['Content-Length']

        return response

    except Exception as e:
        return error_response(f"Error en proxy: {str(e)}", 500)


# ================== RELACIONADOS ==================
@app.route('/relacionados', methods=['POST'])
def relacionados():
    data = request.get_json(silent=True)

    if not data:
        return error_response("Datos no proporcionados")

    canal = data.get("canal")
    titulo = data.get("titulo")

    try:
        if canal:
            query = f"{canal}"
        elif titulo:
            palabras_evitar = ["official", "video", "lyrics", "audio", "hd"]
            query = " ".join([
                palabra for palabra in titulo.split()
                if palabra.lower() not in palabras_evitar
            ])
        else:
            return error_response("Falta título o canal")

        opciones = {
            **YDL_BASE_OPTS,
            'extract_flat': True
        }

        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(f"ytsearch30:{query}", download=False)

        resultados_todos = extraer_videos(info)
        
        if canal:
            canal_lower = canal.lower()
            resultados_filtrados = [
                v for v in resultados_todos 
                if v.get("canal") and canal_lower in v.get("canal").lower()
            ]
            if not resultados_filtrados:
                resultados_filtrados = resultados_todos
        else:
            resultados_filtrados = resultados_todos

        resultados_finales = resultados_filtrados[:10]
        return jsonify(resultados_finales)

    except Exception as e:
        return error_response(f"Error obteniendo relacionados: {str(e)}", 500)


# ================== BASE DE DATOS ==================
@app.route('/agregar-cancion', methods=['POST'])
def agregar_cancion():
    data = request.json

    try:
        conexion = get_connection()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO cancion (direccion, orden, playlist_idplaylist, playlist_usuario_idusuario)
            VALUES (%s, %s, %s, %s)
        """, (
            data["direccion"],               
            data["orden"],                   
            data["playlist_idplaylist"],     
            data["playlist_usuario_idusuario"] 
        ))

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"ok": True, "mensaje": "Canción agregada correctamente"})
    except Exception as e:
        return error_response(f"Error en la base de datos: {str(e)}", 500)


# CORREGIDO: Se removió la función '/like' duplicada e incorrecta
@app.route('/like', methods=['POST'])
def like():
    data = request.json

    try:
        conexion = get_connection()
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO like_cancion (direccion, usuario_idusuario)
            VALUES (%s, %s)
        """, (
            data["direccion"],          
            data["usuario_idusuario"]   
        ))

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({"ok": True, "mensaje": "Like guardado correctamente"})
    except Exception as e:
        return error_response(f"Error al registrar like: {str(e)}", 500)



# ================== OBTENER LIKES ==================
@app.route('/obtener-likes/<int:usuario_id>', methods=['GET'])
def obtener_likes(usuario_id):
    try:
        conexion = get_connection()
        cursor = conexion.cursor(dictionary=True) # dictionary=True nos devuelve los datos ordenados en un objeto/diccionario

        # Seleccionamos las direcciones (URLs o IDs) guardadas por el usuario
        cursor.execute("""
            SELECT direccion FROM like_cancion 
            WHERE usuario_idusuario = %s
        """, (usuario_id,))

        registros = cursor.fetchall()
        cursor.close()
        conexion.close()

        # Extraemos solo las direcciones de los resultados
        direcciones = [reg["direccion"] for reg in registros]

        return jsonify({"ok": True, "likes": direcciones})
    except Exception as e:
        return error_response(f"Error al obtener likes: {str(e)}", 500)
    
    
    
# ================== RUN ==================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)