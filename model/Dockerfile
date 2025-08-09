# Gunakan base image yang sudah memiliki Conda (Miniconda)
FROM continuumio/miniconda3

# Atur direktori kerja
WORKDIR /app

# Salin file environment conda dan skrip training
COPY conda.yaml .
COPY train.py .
COPY data/fraud_detection.csv .

# Buat environment conda dari file.
# Nama environment (mlflow-fraud-detection) diambil dari dalam conda.yaml
RUN conda env create -f conda.yaml

# Perintah default untuk menjalankan training.
# Panggil python dari dalam environment yang baru dibuat secara eksplisit.
CMD ["/opt/conda/envs/mlflow-fraud-detection/bin/python", "train.py"]
