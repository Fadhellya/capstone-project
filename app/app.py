import os
import logging
import mlflow
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mlflow.exceptions import MlflowException
from mlflow.tracking import MlflowClient
from fastapi.middleware.cors import CORSMiddleware # <-- Impor CORS

# --- Basic Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# --- Pydantic Model for Input Data ---
class Transaction(BaseModel):
    amount: float
    merchant_type: str
    device_type: str

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Fraud Detection API",
    description="An API to predict fraudulent transactions using a model from the MLflow Registry.",
    version="1.0.0"
)

# --- PENYESUAIAN PENTING: Tambahkan Middleware CORS ---
# Ini mengizinkan frontend Anda (fraud.team-24.com) untuk berkomunikasi dengan API ini.
origins = [
    "http://fraud.team-24.com",
    "https://fraud.team-24.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MLflow and Model Configuration ---
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow_server:5001")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

MODEL_NAME = "fraud-detection-model"
MODEL_ALIAS = "production"
model = None
model_version = "N/A"

# --- Model Loading on Startup ---
@app.on_event("startup")
def load_model():
    """
    Loads the machine learning model from the MLflow Model Registry
    during the application's startup.
    """
    global model, model_version
    model_uri = f"models:/{MODEL_NAME}@{MODEL_ALIAS}"
    logging.info(f"Attempting to load model from URI: {model_uri}")

    try:
        model = mlflow.pyfunc.load_model(model_uri)
        client = MlflowClient()
        model_version_details = client.get_model_version_by_alias(MODEL_NAME, MODEL_ALIAS)
        model_version = model_version_details.version
        logging.info(f"Successfully loaded model '{MODEL_NAME}' version {model_version} with alias '{MODEL_ALIAS}'.")
    except Exception as e:
        model = None
        model_version = "N/A"
        logging.error(f"A general error occurred while loading the model. Error: {e}", exc_info=True)

# --- API Endpoints ---
@app.get("/status", tags=["Health Check"]) 
def read_root():
    """
    Root endpoint that provides status information about the API and the loaded model.
    """
    model_status = "ready" if model is not None else "not ready (model not loaded)"
    return {
        "api_status": "ok",
        "model_name": MODEL_NAME,
        "model_alias": MODEL_ALIAS,
        "model_status": model_status,
        "model_version": model_version
    }

@app.post("/predict", tags=["Prediction"])
def predict_fraud(transaction: Transaction):
    """
    Predicts if a transaction is fraudulent.
    Takes transaction details as input and returns the prediction.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not ready for predictions. Check server logs.")

    try:
        input_df = pd.DataFrame([transaction.dict()])
        prediction = model.predict(input_df)
        is_fraud = int(prediction[0])
        return {
            "prediction": is_fraud,
            "prediction_label": "Fraud" if is_fraud == 1 else "Not Fraud",
            "model_version": model_version
        }
    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

@app.post("/refresh-model", tags=["Management"])
def refresh_model():
    """
    Endpoint to manually trigger reloading the model from the MLflow Model Registry.
    """
    logging.info("Received request to refresh the model.")
    load_model()
    if model:
        return {"message": f"Model '{MODEL_NAME}@{MODEL_ALIAS}' version {model_version} reloaded successfully."}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload the model. Check server logs.")
