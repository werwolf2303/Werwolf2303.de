#!/usr/bin/env python3
"""
Live-reload HTTP server with WebSocket push.

Serves files from the current directory and injects a script into HTML
responses that connects once via WebSocket. When file changes are detected,
the server pushes a "reload" command — no polling.

Usage: python server.py [--redirect-production] [port]
"""

import argparse
import asyncio
import http.server
import os
import threading
import websockets

parser = argparse.ArgumentParser(description="Live-reload HTTP server")
parser.add_argument("port", nargs="?", type=int, default=8000)
args = parser.parse_args()

PORT = args.port
WS_PORT = PORT + 1
WATCH_INTERVAL = 1
WATCH_EXTENSIONS = {".mjs", ".js", ".css", ".html", ".json"}

# ─── WebSocket server ──────────────────────────────────────────────────────────

_ws_clients = set()
_ws_loop = None


async def ws_handler(websocket):
    _ws_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        _ws_clients.discard(websocket)


async def ws_send_reload():
    for client in _ws_clients.copy():
        try:
            await client.send("reload")
        except websockets.ConnectionClosed:
            _ws_clients.discard(client)


async def ws_main():
    global _ws_loop
    _ws_loop = asyncio.get_event_loop()
    async with websockets.serve(ws_handler, "localhost", WS_PORT):
        await asyncio.Future()  # run forever


def start_ws_server():
    asyncio.run(ws_main())


def notify_reload():
    if _ws_loop and _ws_clients:
        asyncio.run_coroutine_threadsafe(ws_send_reload(), _ws_loop)


# ─── File watcher ──────────────────────────────────────────────────────────────

_file_mtimes = {}


def scan_files(root):
    result = {}
    for dirpath, _, filenames in os.walk(root):
        if any(part.startswith(".") or part == "node_modules" for part in dirpath.split(os.sep)):
            continue
        for name in filenames:
            if os.path.splitext(name)[1] in WATCH_EXTENSIONS:
                full = os.path.join(dirpath, name)
                try:
                    result[full] = os.path.getmtime(full)
                except OSError:
                    pass
    return result


def watch_loop(root):
    import time
    global _file_mtimes
    _file_mtimes = scan_files(root)

    while True:
        time.sleep(WATCH_INTERVAL)
        new_mtimes = scan_files(root)
        if new_mtimes != _file_mtimes:
            _file_mtimes = new_mtimes
            notify_reload()


# ─── Injected client scripts ──────────────────────────────────────────────────


def build_import_map(root):
    """Read package.json dependencies and resolve each to its entry point."""
    import json
    import subprocess

    pkg_path = os.path.join(root, "package.json")
    if not os.path.exists(pkg_path):
        return "", {}

    with open(pkg_path) as f:
        pkg = json.load(f)

    deps = pkg.get("dependencies", {})
    if not deps:
        return "", {}

    imports = {}
    for name in deps:
        try:
            result = subprocess.run(
                ["node", "-e", f"process.stdout.write(require.resolve('{name}'))"],
                capture_output=True, text=True, cwd=root
            )
            if result.returncode == 0:
                abs_path = result.stdout.strip()
                rel_path = "/" + os.path.relpath(abs_path, root).replace(os.sep, "/")
                imports[name] = rel_path
        except OSError:
            pass

    if not imports:
        return "", {}

    map_json = json.dumps({"imports": imports}, indent=4)
    script = f'\n<script type="importmap">\n{map_json}\n</script>\n'
    return script, imports


IMPORT_MAP = None  # built lazily at startup

RELOAD_SCRIPT = f"""
<script>
(function() {{
    const ws = new WebSocket("ws://" + location.hostname + ":{WS_PORT}");
    ws.onmessage = function(e) {{
        if (e.data === "reload") location.reload();
    }};
}})();
</script>
"""

# ─── HTTP handler ──────────────────────────────────────────────────────────────


class LiveReloadHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Resolve extensionless imports under node_modules/ by rewriting
        # self.path so send_head serves the correct .js file
        if "/node_modules/" in self.path and not os.path.splitext(self.path)[1]:
            fs_path = self.translate_path(self.path)
            if os.path.isfile(fs_path + ".js"):
                self.path = self.path + ".js"
            elif os.path.isdir(fs_path) and os.path.isfile(os.path.join(fs_path, "index.js")):
                self.path = self.path.rstrip("/") + "/index.js"

        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)

        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                candidate = os.path.join(path, index)
                if os.path.exists(candidate):
                    path = candidate
                    break

        if path.endswith(".html") and os.path.isfile(path):
            try:
                with open(path, "rb") as f:
                    content = f.read().decode("utf-8")
            except (OSError, UnicodeDecodeError):
                return super().send_head()

            # Inject import map before first <script> so bare specifiers resolve
            if "<script" in content:
                content = content.replace("<script", IMPORT_MAP + "\n<script", 1)
            else:
                content = IMPORT_MAP + content

            # Inject reload script before </body> or at the end
            if "</body>" in content:
                content = content.replace("</body>", RELOAD_SCRIPT + "</body>")
            else:
                content += RELOAD_SCRIPT

            encoded = content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
            return None

        if path.endswith(".mjs") and os.path.isfile(path):
            try:
                with open(path, "rb") as f:
                    content = f.read()
            except OSError:
                return super().send_head()

            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return None

        # Serve .js files from node_modules with import rewriting
        if path.endswith(".js") and os.path.isfile(path) and "/node_modules/" in path:
            content = _rewrite_node_imports(path)
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return None

        return super().send_head()

    def log_message(self, format, *args):
        if "/__livereload__" in str(args[0]):
            return
        super().log_message(format, *args)


import re

_IMPORT_RE = re.compile(
    r"""((?:import|export)\s+(?:.*?\s+from\s+)?['"])([^'"]+)(['"])"""
)


def _rewrite_node_imports(file_path):
    """Rewrite relative imports in node_modules .js files to add .js extensions."""
    with open(file_path, "rb") as f:
        source = f.read().decode("utf-8")

    file_dir = os.path.dirname(file_path)

    def rewrite(match):
        prefix, specifier, quote = match.groups()
        # Only rewrite relative imports
        if not specifier.startswith("."):
            return match.group(0)
        # Already has an extension
        if os.path.splitext(specifier)[1]:
            return match.group(0)
        # Try resolving with .js
        resolved = os.path.join(file_dir, specifier)
        if os.path.isfile(resolved + ".js"):
            return f"{prefix}{specifier}.js{quote}"
        # Try resolving as directory with index.js
        if os.path.isdir(resolved) and os.path.isfile(os.path.join(resolved, "index.js")):
            return f"{prefix}{specifier}/index.js{quote}"
        return match.group(0)

    return _IMPORT_RE.sub(rewrite, source).encode("utf-8")


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    global IMPORT_MAP
    root = os.getcwd()

    IMPORT_MAP, resolved = build_import_map(root)
    if resolved:
        print(f"Import map ({len(resolved)} dependencies):")
        for name, path in resolved.items():
            print(f"  {name} -> {path}")

    ws_thread = threading.Thread(target=start_ws_server, daemon=True)
    ws_thread.start()

    watcher = threading.Thread(target=watch_loop, args=(root,), daemon=True)
    watcher.start()

    with http.server.HTTPServer(("", PORT), LiveReloadHandler) as httpd:
        print(f"Live-reload server at http://localhost:{PORT}")
        print(f"WebSocket server at ws://localhost:{WS_PORT}")
        print(f"Watching {root} for changes to {', '.join(sorted(WATCH_EXTENSIONS))}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
