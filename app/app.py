from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import mlflow

# Define the input data schema using Pydantic
class Transaction(BaseModel):
    amount: float
    merchant_type: str
    device_type: str

# Initialize the FastAPI app
app = FastAPI(title="Fraud Detection API", version="1.0")

# --- Model Loading ---
# This section loads the latest "Production" version of our model from the MLflow Registry.
# It will fail if no model is in "Production" yet.
try:
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    model_name = "fraud-detection-model"
    stage = "Production"
    model = mlflow.pyfunc.load_model(model_uri=f"models:/{model_name}/{stage}")
    print(f"Successfully loaded model '{model_name}' version {model.metadata.version} from stage '{stage}'.")
except Exception as e:
    model = None
    print(f"Error loading model: {e}")
    print("Prediction endpoint will be disabled.")


@app.get("/", tags=["Health Check"])
def read_root():
    """Root endpoint to check if the API is running."""
    return {"status": "API is running"}

@app.post("/predict", tags=["Prediction"])
def predict_fraud(transaction: Transaction):
    """
    Predicts if a transaction is fraudulent.
    Takes transaction details as input and returns the prediction.
    """
    if model is None:
        return {"error": "Model is not loaded. Please check the server logs."}

    # Convert input data to a pandas DataFrame
    input_df = pd.DataFrame([transaction.dict()])
    
    # Make a prediction
    prediction = model.predict(input_df)
    
    # The output of a scikit-learn model is a numpy array, so we convert it to a standard Python type
    is_fraud = int(prediction[0])

    return {
        "prediction": is_fraud,
        "prediction_label": "Fraud" if is_fraud == 1 else "Not Fraud",
        "model_version": model.metadata.version
    }
