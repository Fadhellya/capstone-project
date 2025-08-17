import logging
import mlflow
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTENC
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from scikeras.wrappers import KerasClassifier

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def create_keras_model(meta):
    """Defines and compiles a simple Keras neural network."""
    n_features_in_ = meta["n_features_in_"]
    model = keras.Sequential([
        keras.layers.Input(shape=(n_features_in_,)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(optimizer='adam',
                  loss='binary_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    """Main function to train, evaluate, and log the model."""
    logging.info("Starting the training process...")

    data_path = "fraud_detection.csv"
    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: Data file not found at '{data_path}'.")
        exit(1)

    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset loaded and split successfully.")

    categorical_features = [col for col in X_train.columns if X_train[col].dtype == 'object']
    numerical_features = [col for col in X_train.columns if X_train[col].dtype != 'object']

    if y_train.value_counts(normalize=True).min() < 0.4:
        logging.info("Applying SMOTENC resampling.")
        sm = SMOTENC(categorical_features=categorical_features, random_state=42, sampling_strategy=0.4)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    # Define and fit the preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    with mlflow.start_run(run_name="fraud_detection_keras_training") as run:
        logging.info(f"MLflow run started. Run ID: {run.info.run_id}")

        # --- PENYESUAIAN PENTING ---
        # Create and train the Keras model directly on processed data
        keras_model = create_keras_model(meta={"n_features_in_": X_train_processed.shape[1]})
        
        logging.info("Training the Keras model...")
        keras_model.fit(
            X_train_processed, 
            y_train,
            epochs=20,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        logging.info("Model training complete.")

        # Evaluate the model
        y_pred_proba = keras_model.predict(X_test_processed)
        y_pred = (y_pred_proba > 0.5).astype(int)

        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred)
        }
        mlflow.log_metrics(metrics)
        logging.info(f"Logged final metrics: {metrics}")
        
        # --- PENYESUAIAN PENTING ---
        # For logging, create the final deployable pipeline by combining
        # the FITTED preprocessor and the FITTED Keras model.
        
        # Wrap the FITTED Keras model in the Scikit-learn compatible wrapper
        keras_estimator = KerasClassifier(model=keras_model, loss="binary_crossentropy")
        # Manually mark it as fitted to avoid issues
        keras_estimator.fit_ = True 

        # Create the final pipeline object
        final_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', keras_estimator)
        ])
        
        # Infer signature and log the entire pipeline
        signature = mlflow.models.infer_signature(X_train, final_pipeline.predict(X_train))
        logging.info("Logging model pipeline to MLflow Registry...")
        mlflow.sklearn.log_model(
            sk_model=final_pipeline,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud-detection-model"
        )
        logging.info("Model trained and registered successfully.")

if __name__ == "__main__":
    main()
