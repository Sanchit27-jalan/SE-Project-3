from flask import Flask, Response, request
import requests
import json
app = Flask(__name__)
import subprocess

ROUTE_MAP = {
    
    # Add more mappings as needed
}


def load_map(file_path):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

@app.route('/<client>', defaults={'path': ''}, methods=["GET", "POST", "PUT", "DELETE"])
@app.route('/<client>/<path:path>', methods=["GET", "POST", "PUT", "DELETE"])
def proxy(client, path):
    # Load the route map from a JSON file
    ROUTE_MAP = load_map('route_map.json')
    base_url = ROUTE_MAP.get(client)
    print(f"Base URL for {client}: {base_url}")
    if not base_url:
        return {"error": "Unknown client"}, 404

    print(f"Client: {client}, Path: {path}")
    target_url = f"{base_url}/{path}"
    resp = requests.request(
        method=request.method,
        url=target_url,
        headers={key: value for (key, value) in request.headers if key.lower() != 'host'},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False
    )
    print(f"Proxying {request.method} request to {target_url}")
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    print(resp.content)
    print(resp.status_code)
    print(headers)
    return Response(resp.content, resp.status_code, headers)

if __name__ == '__main__':
    subprocess.Popen(["ngrok", "http", "8080"])

    app.run(port=8080)
