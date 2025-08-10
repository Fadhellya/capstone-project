FROM python:3.9-slim

WORKDIR /app

COPY check_model_version.py /app/

# Install dependencies kalau ada
# COPY requirements.txt /app/
# RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "check_model_version.py"]
