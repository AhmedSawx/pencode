import webview
import base64
import os
import json
import sys
import bottle
import threading
from datetime import datetime

def get_app_data_dir():
    # Get the appropriate app data directory for the OS
    if sys.platform == "win32":
        return os.path.join(os.environ["APPDATA"], "Pencode")
    elif sys.platform == "darwin":
        return os.path.join(
            os.path.expanduser("~"), "Library", "Application Support", "Pencode"
        )
    else:  # Linux
        return os.path.join(os.path.expanduser("~"), ".config", "Pencode")


class Api:
    def __init__(self):
        self.app_data_dir = get_app_data_dir()
        self.projects_dir = os.path.join(self.app_data_dir, "projects")
        self.log_file_path = os.path.join(self.app_data_dir, "pencode_log.txt")

        if not os.path.exists(self.projects_dir):
            os.makedirs(self.projects_dir)
        self._log("--- Pencode session started ---")

    def _log(self, message):
        try:
            with open(self.log_file_path, "a") as f:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"[{timestamp}] {message}\n")
        except Exception as e:
            # Cannot log, print to stderr if possible
            print(f"Failed to write to log file: {e}", file=sys.stderr)

    def get_projects_dir(self):
        return self.projects_dir

    def _normalize_path(self, file_path):
        self._log(f"--- Path Normalization ---")
        self._log(f"Input path: '{file_path}'")

        if not file_path or not isinstance(file_path, str):
            self._log("Path is None or not a string, returning None.")
            self._log(f"--- End Path Normalization ---")
            return None

        try:
            self._log(f"os.getcwd(): '{os.getcwd()}'")
            self._log(f"Is absolute before any processing: {os.path.isabs(file_path)}")

            # On Windows, a path with a drive letter is absolute.
            # Let's check for that.
            if sys.platform == "win32":
                self._log(f"Running on Windows.")
                drive, tail = os.path.splitdrive(file_path)
                self._log(f"splitdrive result: drive='{drive}', tail='{tail}'")

            norm_path = os.path.normpath(file_path)
            self._log(f"After os.path.normpath: '{norm_path}'")
            self._log(f"Is absolute after normpath: {os.path.isabs(norm_path)}")

            abs_path = os.path.abspath(norm_path)
            self._log(f"After os.path.abspath: '{abs_path}'")
            self._log(f"--- End Path Normalization ---")
            return abs_path
        except Exception as e:
            self._log(f"ERROR during path normalization: {str(e)}")
            self._log(f"--- End Path Normalization with ERROR ---")
            return None

    def _save_binary_data(self, file_path, data):
        self._log(f"_save_binary_data: Received path: '{file_path}'")
        normalized_path = self._normalize_path(file_path)
        self._log(f"_save_binary_data: Normalized path to: '{normalized_path}'")
        if not normalized_path:
            self._log("Path is invalid.")
            return {"success": False, "error": "Invalid file path provided."}
        try:
            binary_data = base64.b64decode(data)
            with open(normalized_path, "wb") as f:
                f.write(binary_data)
            self._log(f"Successfully saved file to: {normalized_path}")
            return {"success": True, "path": normalized_path}
        except Exception as e:
            self._log(f"ERROR in _save_binary_data: {str(e)}")
            return {"success": False, "error": str(e)}

    def save_project(self, file_path, data):
        return self._save_binary_data(file_path, data)

    def save_image(self, file_path, data):
        return self._save_binary_data(file_path, data)

    def save_brush(self, file_path, data):
        return self._save_binary_data(file_path, data)

    def load_project(self, file_path):
        self._log(f"load_project: Received path: '{file_path}'")
        normalized_path = self._normalize_path(file_path)
        self._log(f"load_project: Normalized path to: '{normalized_path}'")
        if not normalized_path:
            return {"success": False, "error": "Invalid file path provided."}
        try:
            with open(normalized_path, "rb") as f:
                binary_data = f.read()
            base64_data = base64.b64encode(binary_data).decode("utf-8")
            return {"success": True, "data": base64_data, "filePath": normalized_path}
        except Exception as e:
            self._log(f"ERROR in load_project: {str(e)}")
            return {"success": False, "error": str(e)}

    def list_projects(self):
        try:
            files = [
                os.path.join(self.projects_dir, f)
                for f in os.listdir(self.projects_dir)
                if f.endswith(".pencode")
            ]
            self._log(f"Listing projects: Found {len(files)} projects.")
            return {"success": True, "files": files}
        except Exception as e:
            self._log(f"ERROR in list_projects: {str(e)}")
            return {"success": False, "error": str(e)}

    def show_save_as_dialog(self, default_filename, file_types):
        window = webview.windows[0]
        self._log(f"show_save_as_dialog: Invoking with default_filename='{default_filename}', file_types='{file_types}'")
        result = window.create_file_dialog(
            webview.SAVE_DIALOG,
            directory=self.projects_dir,
            save_filename=default_filename,
            file_types=file_types,
        )
        if isinstance(result, tuple):
            path = result[0] if result else None
        else:
            path = result
        self._log(f"show_save_as_dialog: Returned path: '{path}'")

        if path and sys.platform == "win32":
            # Check for common windows path issues from file dialogs
            if len(path) == 1 and 'A' <= path.upper() <= 'Z':
                self._log(f"WARNING: File dialog returned a single letter, which is likely incorrect. Path: '{path}'. Returning None.")
                return None
            
            drive, tail = os.path.splitdrive(path)
            if drive and tail == '': # Path is something like 'C:'
                 self._log(f"WARNING: File dialog returned a drive root, not a file path. Path: '{path}'. Returning None.")
                 return None

        return path

    def show_open_dialog(self, file_types):
        window = webview.windows[0]
        self._log(f"show_open_dialog: Invoking with file_types='{file_types}'")
        result = window.create_file_dialog(
            webview.OPEN_DIALOG,
            directory=self.projects_dir,
            file_types=file_types,
            allow_multiple=False,
        )
        self._log(f"show_open_dialog: Raw result from create_file_dialog: {result}")
        if isinstance(result, tuple):
            path = result[0] if result else None
        else:
            path = result
        self._log(f"show_open_dialog: Returned path: '{path}'")
        return path

    def quit_app(self):
        self._log("Quit app called.")
        window = webview.windows[0]
        window.destroy()

    def delete_project_file(self, file_path):
        self._log(f"delete_project_file: Received path: '{file_path}'")
        normalized_path = self._normalize_path(file_path)
        self._log(f"delete_project_file: Normalized path to: '{normalized_path}'")
        if not normalized_path:
            return {"success": False, "error": "Invalid file path provided."}
        try:
            if os.path.exists(normalized_path):
                os.remove(normalized_path)
                self._log(f"Successfully deleted file: {normalized_path}")
                return {"success": True, "path": normalized_path}
            else:
                self._log("File not found for deletion.")
                return {"success": False, "error": "File not found"}
        except Exception as e:
            self._log(f"ERROR in delete_project_file: {str(e)}")
            return {"success": False, "error": str(e)}

    def check_file_exists(self, file_path):
        return os.path.exists(file_path)

    def load_metadata(self):
        try:
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, "r") as f:
                    return {"success": True, "data": json.load(f)}
            else:
                return {"success": True, "data": []}  # Return empty list if no file
        except Exception as e:
            return {"success": False, "error": str(e)}

    def save_metadata(self, data):
        try:
            with open(self.metadata_path, "w") as f:
                json.dump(data, f)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}


# --- Bottle Web Server ---
app = bottle.Bottle()
api = Api()


@app.route("/api/ping", method="GET")
def ping():
    return {"status": "ok"}


@app.route("/api/projects", method="GET")
def list_projects_api():
    return api.list_projects()


@app.route("/api/load_project", method="POST")
def load_project_api():
    body = bottle.request.json
    file_path = body.get("path")
    if not file_path:
        bottle.response.status = 400
        return {"success": False, "error": "Missing file path"}
    return api.load_project(file_path)


@app.route("/api/save_project", method="POST")
def save_project_api():
    body = bottle.request.json
    file_path = body.get("path")
    data = body.get("data")
    if not file_path or data is None:
        bottle.response.status = 400
        return {"success": False, "error": "Missing file path or data"}
    return api.save_project(file_path, data)


@app.route("/api/delete_project", method="POST")
def delete_project_api():
    body = bottle.request.json
    file_path = body.get("path")
    if not file_path:
        bottle.response.status = 400
        return {"success": False, "error": "Missing file path"}
    return api.delete_project_file(file_path)


if "NUITKA_ONEFILE_PARENT" in os.environ:
    base_path = os.path.dirname(os.path.abspath(__file__))
else:
    # Development mode
    base_path = os.path.abspath(".")

STATIC_ROOT = os.path.join(base_path, 'dist')
icon_path = os.path.join(base_path, 'public/Pencode-logo-dark.svg')


@app.route("/<filepath:path>")
def server_static(filepath):
    if filepath.startswith("api/"):
        bottle.abort(404)
    return bottle.static_file(filepath, root=STATIC_ROOT)


@app.route("/")
def index():
    return bottle.static_file("index.html", root=STATIC_ROOT)


def run_server():
    bottle.run(app, host="localhost", port=8080, quiet=True)


if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()


    webview.create_window(
        "Pencode",
        "http://localhost:8080",
        js_api=api,
        width=1280,
        height=800,
        resizable=True,
        min_size=(800, 600),
    )
    webview.start(debug=False, icon=icon_path)
