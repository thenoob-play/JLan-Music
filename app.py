import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp

# 1. Una SOLA configuración de app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# 2. La ruta raíz que sirve tu index.html
@app.route('/')
def index():
    # Esto busca el archivo index.html en la carpeta raíz de tu proyecto
    return send_from_directory('.', 'index.html')

def extraer_videos(query, limite=10):
    opciones = {
        'quiet': True,
        'extract_flat': True,
    }
    resultados = []
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(f"ytsearch{limite}:{query}", download=False)
        for video in info['entries']:
            resultados.append({
                "id": video.get("id"),
                "titulo": video.get("title"),
                "url": f"https://www.youtube.com/watch?v={video.get('id')}",
                "thumbnail": f"https://i.ytimg.com/vi/{video.get('id')}/hqdefault.jpg"
            })
    return resultados

@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.json
    query = data.get("query")
    return jsonify(extraer_videos(query))

@app.route('/top-canciones', methods=['GET'])
def top_canciones():
    playlist_url = "https://www.youtube.com/playlist?list=PLSYbV1H4VkCdUUgsgAaeRwI5964Lu2ljC"
    opciones = {
        'quiet': True,
        'extract_flat': True, 
        'playlistend': 12     
    }
    resultados = []
    with yt_dlp.YoutubeDL(opciones) as ydl:
        try:
            info = ydl.extract_info(playlist_url, download=False)
            for video in info.get('entries', []):
                if video:
                    resultados.append({
                        "id": video.get("id"),
                        "titulo": video.get("title"),
                        "canal": video.get("uploader"),
                        "url": f"https://www.youtube.com/watch?v={video.get('id')}",
                        "thumbnail": f"https://i.ytimg.com/vi/{video.get('id')}/hqdefault.jpg"
                    })
        except Exception as e:
            return jsonify({"error": "No se pudo cargar la lista"}), 500
    return jsonify(resultados)

@app.route('/stream', methods=['POST'])
def stream():
    data = request.json
    url = data.get("url")
    opciones = {'format': 'bestaudio', 'quiet': True}
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(url, download=False)
        return jsonify({
            "audio_url": info['url'],
            "titulo": info.get("title")
        })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)