import os
import requests
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import yt_dlp

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def index():
    # Esto asegura que busque el index.html en la raíz del proyecto
    return send_from_directory('.', 'index.html')

@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.json
    query = data.get("query")
    if not query: return jsonify([])
    
    opciones = {'quiet': True, 'extract_flat': True}
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(f"ytsearch10:{query}", download=False)
        resultados = [{
            "id": v.get("id"),
            "titulo": v.get("title"),
            "url": f"https://www.youtube.com/watch?v={v.get('id')}",
            "thumbnail": f"https://i.ytimg.com/vi/{v.get('id')}/hqdefault.jpg"
        } for v in info.get('entries', []) if v]
    return jsonify(resultados)

@app.route('/top-canciones', methods=['GET'])
def top_canciones():
    playlist_url = "https://www.youtube.com/playlist?list=PLSYbV1H4VkCdUUgsgAaeRwI5964Lu2ljC"
    opciones = {'quiet': True, 'extract_flat': True, 'playlistend': 12}
    with yt_dlp.YoutubeDL(opciones) as ydl:
        info = ydl.extract_info(playlist_url, download=False)
        resultados = [{
            "id": v.get("id"),
            "titulo": v.get("title"),
            "url": f"https://www.youtube.com/watch?v={v.get('id')}",
            "thumbnail": f"https://i.ytimg.com/vi/{v.get('id')}/hqdefault.jpg"
        } for v in info.get('entries', []) if v]
    return jsonify(resultados)

@app.route('/stream', methods=['POST'])
def stream():
    data = request.json
    url = data.get("url")
    if not url: return jsonify({"error": "No URL"}), 400

    opciones = {
        'format': 'bestaudio',
        'quiet': True,
        'extractor_args': {'youtube': {'player_client': ['android']}}
    }

    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            info = ydl.extract_info(url, download=False)
            audio_url = None
            for f in info.get('formats', []):
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                    audio_url = f.get('url')
                    break
            
            if not audio_url: return jsonify({"error": "No audio"}), 500

            # LA CLAVE: Enviar a nuestro propio proxy en lugar de a YouTube directamente
            return jsonify({
                "audio_url": f"/proxy-audio?url={requests.utils.quote(audio_url)}",
                "titulo": info.get("title")
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/proxy-audio')
def proxy_audio():
    target_url = request.args.get('url')
    # El servidor de Render descarga el audio y lo reenvía a tu navegador
    def generate():
        r = requests.get(target_url, stream=True)
        for chunk in r.iter_content(chunk_size=1024*10):
            yield chunk
    return Response(generate(), content_type="audio/mpeg")

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)