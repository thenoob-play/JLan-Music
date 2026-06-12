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

    
    
# ================== RUN ==================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)