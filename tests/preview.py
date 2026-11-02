"""Safe local preview: python3 tests/preview.py. No external submissions.

Only serves repository web assets; does not change production HTML or endpoints.
Responses are local HTTP mocks, with real browser fetch/AbortController/timers.
"""
import json
import mimetypes
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent.parent
CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; form-action 'none'; base-uri 'self'; object-src 'none'"
CASES = {'fast', 'delayed', 'body', 'stalled', 'stalled-body', 'invalid', 'rejected', 'http', 'network'}

class Preview(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Do not log form values or request bodies.

    def send_headers(self, status, mime, length=None):
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        if length is not None:
            self.send_header('Content-Length', str(length))
        self.end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__preview/':
            file = ROOT / 'tests/preview.html'
        elif path == '/__preview.js':
            file = ROOT / 'tests/preview.js'
        elif path in ('/', '/index.html'):
            file = ROOT / 'index.html'
        else:
            file = (ROOT / path.lstrip('/')).resolve()
            if not file.is_relative_to(ROOT) or path.startswith('/tests/') or not (path.startswith('/assets/') or path in ('/app.js', '/application.js', '/measurement.js', '/style.css', '/tesekkurler.html')):
                self.send_error(404); return
        if not file.is_file():
            self.send_error(404); return
        data = file.read_bytes()
        if file.name == 'index.html':
            # Load interception before any production script. CSP independently
            # blocks all external fetch and native form submissions if JS fails.
            data = data.replace(b'<head>', b'<head><script src="/__preview.js"></script>', 1)
        self.send_headers(200, (mimetypes.guess_type(str(file))[0] or 'application/octet-stream') + ('; charset=utf-8' if file.suffix in ('.js', '.html', '.css') else ''), len(data))
        self.wfile.write(data)

    def do_POST(self):
        url = urlsplit(self.path)
        case = parse_qs(url.query).get('case', ['fast'])[0]
        if url.path != '/__mock' or case not in CASES:
            self.send_error(405); return
        length = int(self.headers.get('Content-Length', 0))
        if length > 16384:
            self.send_error(413); return
        self.rfile.read(length)  # Discard immediately; no email, storage or proxy.
        try:
            if case == 'network':
                self.close_connection = True
                return
            if case in ('delayed', 'stalled'):
                time.sleep(45 if case == 'delayed' else 120)
            elif case not in ('body', 'stalled-body'):
                time.sleep(0.5)
            data = (b'<html>bad JSON</html>' if case == 'invalid' else json.dumps({'success': case != 'rejected'}).encode())
            self.send_headers(503 if case == 'http' else 200, 'application/json', len(data))
            self.wfile.flush()
            if case in ('body', 'stalled-body'):
                time.sleep(45 if case == 'body' else 120)
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Browser timeout/navigation legitimately closes the socket.

if __name__ == '__main__':
    print('Safe PR preview: http://127.0.0.1:8765/__preview/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8765), Preview).serve_forever()
