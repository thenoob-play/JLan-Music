import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# 🔍 BUSCAR VIDEOS
@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.json
    query = data.get("query")

    if not query:
        return jsonify([])

    resultados = []

    opciones = {
        'quiet': True,
        'extract_flat': True,
    }

    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(f"ytsearch10:{query}", download=False)

        for video in info.get('entries', []):
            if video:
                resultados.append({
                    "id": video.get("id"),
                    "titulo": video.get("title"),
                    "url": f"https://www.youtube.com/watch?v={video.get('id')}",
                    "thumbnail": f"https://i.ytimg.com/vi/{video.get('id')}/hqdefault.jpg"
                })

    return jsonify(resultados)


# 🔥 TOP CANCIONES
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
        info = ydl.extract_info(playlist_url, download=False)

        for video in info.get('entries', []):
            if video:
                resultados.append({
                    "id": video.get("id"),
                    "titulo": video.get("title"),
                    "url": f"https://www.youtube.com/watch?v={video.get('id')}",
                    "thumbnail": f"https://i.ytimg.com/vi/{video.get('id')}/hqdefault.jpg"
                })

    return jsonify(resultados)


# 🎧 STREAM MEJORADO
@app.route('/stream', methods=['POST'])
def stream():
    data = request.json
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    opciones = {
        'format': 'bestaudio',
        'quiet': True,
        'no_warnings': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['android']
            }
        }
    }

    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(url, download=False)

            audio_url = None

            for f in info.get('formats', []):
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                    audio_url = f.get('url')
                    break

            if not audio_url:
                return jsonify({"error": "No audio found"}), 500

            return jsonify({
                "audio_url": audio_url,
                "titulo": info.get("title")
            })

    except Exception as e:
        print("ERROR STREAM:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)