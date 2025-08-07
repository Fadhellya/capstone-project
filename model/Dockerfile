FROM python:3.9-slim

# Atur direktori kerja di dalam kontainer
WORKDIR /app

# Salin file dependensi terlebih dahulu
# (Asumsi Anda punya file conda.yaml di root proyek)
COPY ../conda.yaml .

# Install dependensi menggunakan conda/pip
# Pertama, install conda
RUN pip install conda
RUN conda env create -f conda.yaml --name mlflow-fraud-detection

# Aktifkan environment conda
SHELL ["conda", "run", "-n", "mlflow-fraud-detection", "/bin/bash", "-c"]

# Salin skrip training Anda
COPY . .

# Perintah default saat kontainer dijalankan
CMD ["python", "train.py"]
