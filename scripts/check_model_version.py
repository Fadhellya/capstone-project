import os
import mlflow
from mlflow.tracking import MlflowClient

# --- Konfigurasi ---
# Alamat MLflow server di dalam jaringan Docker
MLFLOW_TRACKING_URI = "http://mlflow_server:5001"

# Nama model dan alias yang akan dipantau
MODEL_NAME = "fraud-detection-model"
MODEL_ALIAS = "production"

# Nama file untuk menyimpan versi terakhir yang di-deploy.
# File ini akan dibuat di dalam workspace Jenkins.
LAST_VERSION_FILE = "last_deployed_version.txt"

def get_current_production_version():
    """
    Menghubungi MLflow server dan mendapatkan nomor versi dari model
    yang saat ini memiliki alias 'production'.
    """
    try:
        client = MlflowClient(tracking_uri=MLFLOW_TRACKING_URI)
        model_version_details = client.get_model_version_by_alias(MODEL_NAME, MODEL_ALIAS)
        return model_version_details.version
    except Exception as e:
        print(f"Error: Tidak dapat menemukan model '{MODEL_NAME}' dengan alias '{MODEL_ALIAS}'.")
        print(f"Pesan dari MLflow: {e}")
        return None

def get_last_deployed_version():
    """
    Membaca nomor versi yang terakhir kali di-deploy dari file teks.
    """
    if os.path.exists(LAST_VERSION_FILE):
        with open(LAST_VERSION_FILE, "r") as f:
            return f.read().strip()
    # Jika file tidak ada (misalnya, saat pertama kali dijalankan), kembalikan None.
    return None

def save_deployed_version(version):
    """
    Menyimpan nomor versi yang baru saja di-deploy ke dalam file teks.
    """
    with open(LAST_VERSION_FILE, "w") as f:
        f.write(str(version))
    print(f"Berhasil menyimpan versi {version} sebagai versi yang terakhir di-deploy.")

if __name__ == "__main__":
    current_version = get_current_production_version()
    last_version = get_last_deployed_version()

    print(f"Versi 'production' saat ini di MLflow: {current_version}")
    print(f"Versi yang terakhir di-deploy (dari file): {last_version}")

    # Bandingkan versi saat ini dengan versi terakhir
    if current_version and current_version != last_version:
        print("HASIL: Perubahan versi terdeteksi! Proses deployment akan dilanjutkan.")
        save_deployed_version(current_version)
        # Keluar dengan exit code 0 (sukses) untuk memberitahu Jenkins agar melanjutkan pipeline.
        exit(0)
    else:
        print("HASIL: Tidak ada perubahan versi. Proses deployment dihentikan.")
        # Keluar dengan exit code 1 (gagal) untuk memberitahu Jenkins agar menghentikan pipeline.
        exit(1)
