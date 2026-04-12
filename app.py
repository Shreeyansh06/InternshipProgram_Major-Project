"""
app.py
Flask backend for the Churn Prediction Dashboard.

Routes:
  POST /api/upload          — upload CSV, kick off ML pipeline in background
  GET  /api/status/<job_id> — poll job status
  GET  /api/results/<job_id>— fetch results JSON when complete
  GET  /outputs/<filename>  — serve generated chart images

Run:
  pip install flask flask-cors
  python app.py
"""

import os
import uuid
import threading

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# In-memory job store  {job_id: {"status": ..., "results": ..., "error": ...}}
jobs: dict = {}


def _run_pipeline(job_id: str, file_path: str) -> None:
    try:
        from ml_pipeline import run_pipeline
        results = run_pipeline(file_path)
        jobs[job_id]["results"] = results
        jobs[job_id]["status"]  = "complete"
    except Exception as exc:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"]  = str(exc)


@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    job_id    = str(uuid.uuid4())
    save_path = os.path.join("uploads", f"{job_id}.csv")
    file.save(save_path)

    jobs[job_id] = {"status": "processing", "results": None, "error": None}
    threading.Thread(target=_run_pipeline, args=(job_id, save_path), daemon=True).start()

    return jsonify({"job_id": job_id})


@app.route("/api/status/<job_id>")
def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({"status": job["status"], "error": job.get("error")})


@app.route("/api/results/<job_id>")
def results(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job["status"] != "complete":
        return jsonify({"error": "Job not complete yet"}), 400
    return jsonify(job["results"])


@app.route("/outputs/<path:filename>")
def serve_output(filename: str):
    return send_from_directory("outputs", filename)


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Churn Prediction Dashboard — Flask Backend")
    print("=" * 60)
    print("API running at:  http://localhost:5000")
    print("Frontend (Vite): http://localhost:5173")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5000, host="0.0.0.0")
