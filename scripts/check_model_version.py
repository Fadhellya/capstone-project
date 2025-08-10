import os
import mlflow
from mlflow.tracking import MlflowClient

# --- Konfigurasi ---
MLFLOW_TRACKING_URI = "http://mlflow_server:5001"
MODEL_NAME = "fraud-detection-model"
MODEL_ALIAS = "production"

# --- PENYESUAIAN PENTING ---
# Path ini akan kita mount dari Jenkins
STATE_DIR = "/state"
LAST_VERSION_FILE = os.path.join(STATE_DIR, "last_deployed_version.txt")

def get_current_production_version():
    """Mendapatkan versi model dari alias 'production'."""
    try:
        client = MlflowClient(tracking_uri=MLFLOW_TRACKING_URI)
        model_version_details = client.get_model_version_by_alias(MODEL_NAME, MODEL_ALIAS)
        return model_version_details.version
    except Exception as e:
        print(f"Error: Tidak dapat menemukan model '{MODEL_NAME}' dengan alias '{MODEL_ALIAS}'. Pesan: {e}")
        return None

def get_last_deployed_version():
    """Membaca versi terakhir dari file di lokasi permanen."""
    if os.path.exists(LAST_VERSION_FILE):
        with open(LAST_VERSION_FILE, "r") as f:
            return f.read().strip()
    return None

def save_deployed_version(version):
    """Menyimpan versi baru ke file di lokasi permanen."""
    os.makedirs(STATE_DIR, exist_ok=True) # Pastikan direktori ada
    with open(LAST_VERSION_FILE, "w") as f:
        f.write(str(version))
    print(f"Berhasil menyimpan versi {version} sebagai versi yang terakhir di-deploy.")

if __name__ == "__main__":
    current_version = get_current_production_version()
    last_version = get_last_deployed_version()

    print(f"Versi 'production' saat ini di MLflow: {current_version}")
    print(f"Versi yang terakhir di-deploy (dari file): {last_version}")

    if current_version and current_version != last_version:
        print("HASIL: Perubahan versi terdeteksi! Proses deployment akan dilanjutkan.")
        save_deployed_version(current_version)
        exit(0)
    else:
        print("HASIL: Tidak ada perubahan versi. Proses deployment dihentikan.")
        exit(1)
