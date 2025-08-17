import logging
import mlflow
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTENC
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def create_keras_model(input_shape):
    """Defines and compiles a simple Keras neural network."""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_shape,)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(1, activation='sigmoid') # Sigmoid for binary classification
    ])
    
    model.compile(optimizer='adam',
                  loss='binary_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    """Main function to train, evaluate, and log the model."""
    logging.info("Starting the training process...")

    data_path = "fraud_detection.csv"

    # Load the dataset
    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: Data file not found at '{data_path}'.")
        exit(1)

    # Split the data
    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset loaded and split successfully.")

    # Identify categorical and numerical features by name
    categorical_features = [col for col in X_train.columns if X_train[col].dtype == 'object']
    numerical_features = [col for col in X_train.columns if X_train[col].dtype != 'object']

    # Apply SMOTENC if needed
    if y_train.value_counts(normalize=True).min() < 0.4:
        logging.info("Class imbalance detected. Applying SMOTENC resampling.")
        sm = SMOTENC(categorical_features=categorical_features, random_state=42, sampling_strategy=0.4)
        X_train, y_train = sm.fit_resample(X_train, y_train)
        logging.info("Resampling completed.")

    # --- PENYESUAIAN PENTING for Keras ---
    # Define the preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # Fit the preprocessor on training data and transform both sets
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Configure MLflow
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    # Enable MLflow autologging for Keras
    mlflow.keras.autolog()

    with mlflow.start_run(run_name="fraud_detection_keras_training") as run:
        logging.info(f"MLflow run started. Run ID: {run.info.run_id}")

        # Create and train the Keras model
        model = create_keras_model(X_train_processed.shape[1])
        
        logging.info("Training the Keras model...")
        model.fit(
            X_train_processed, 
            y_train,
            epochs=20,
            batch_size=32,
            validation_split=0.2,
            verbose=2
        )
        logging.info("Model training complete.")

        # Evaluate the model
        y_pred_proba = model.predict(X_test_processed)
        y_pred = (y_pred_proba > 0.5).astype(int) # Convert probabilities to 0 or 1

        # Log metrics manually (autolog might miss some)
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred)
        }
        mlflow.log_metrics(metrics)
        logging.info(f"Logged final metrics: {metrics}")
        
        # Infer signature and log the model to the registry
        signature = mlflow.models.infer_signature(X_test_processed, y_pred)
        logging.info("Logging model to MLflow Registry...")
        mlflow.keras.log_model(
            model,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud-detection-model"
        )
        logging.info("Model trained and registered successfully.")

if __name__ == "__main__":
    main()
