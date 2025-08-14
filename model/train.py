
import logging
import mlflow
import pandas as pd
from imblearn.over_sampling import SMOTENC
from lightgbm import LGBMClassifier 
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configure connection to the MLflow Tracking Server
mlflow.set_tracking_uri("http://mlflow_server:5001")


# Set the experiment name in the MLflow UI
mlflow.set_experiment("fraud_detection_experiment")

def main():
    """Main function to train, evaluate, and log the model."""
    logging.info("Starting the training process...")

    # --- IMPORTANT ADJUSTMENT ---
    # This path is RELATIVE within the container,
    # because our working directory is /app and the data is mounted to /app/data.
    data_path = "fraud_detection.csv"

    # Load the dataset
    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: Data file not found at '{data_path}'.")
        print("Please ensure the volume mount in docker-compose.yaml is correct.")
        exit(1) # Keluar dari skrip jika data tidak ditemukan

    # Split the data
    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset loaded and split successfully.")

    # Identify categorical features
    categorical_features = [i for i, col in enumerate(X_train.columns) if X_train[col].dtype == 'object']

    # Check for class imbalance and resample if needed
    imbalance_threshold = 0.4  # e.g., if minority class is less than 40% of majority

    class_counts = y_train.value_counts(normalize=True)
    # Calculate the ratio of the minority class
    logging.info(f"Class distribution before resampling:\n{class_counts}")
    minority_ratio = class_counts.min()

    if minority_ratio < imbalance_threshold:
        logging.info("Class imbalance detected. Applying SMOTENC resampling.")
        categorical_features = [i for i, col in enumerate(X_train.columns) if X_train[col].dtype == 'object']
        sm = SMOTENC(categorical_features=categorical_features, random_state=42, sampling_strategy=0.4)
        X_train, y_train = sm.fit_resample(X_train, y_train)
        logging.info("Resampling completed using SMOTENC.")
    else:
        logging.info("No significant class imbalance detected. Proceeding without resampling.")

    # Start an MLflow run
    # Ini buat inisiasi run baru dalam sebuah eksperimen
    with mlflow.start_run() as run:
        run_id = run.info.run_id
        logging.info(f"MLflow run started. Run ID: {run_id}")

        # Define parameter grid for RandomForestClassifier
        param_grid = {'model__boosting_type': [50, 100, 250, 500]
            , 'model__n_estimators': [1, 2, 5]
            , 'model__num_leaves': [10, 25, 50, 100]
        }
        
        base_model = LGBMClassifier(random_state=42)

        # Define the preprocessing pipeline
        preprocessor = ColumnTransformer(
            [('onehot', OneHotEncoder(handle_unknown='ignore'), categorical_features)],
            remainder='passthrough'
        ) #OnneHotEncoder is used to handle categorical features

        # Create the full pipeline
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', base_model)
        ])

        # Hyperparameter tuning with GridSearchCV
        skf = StratifiedKFold(n_splits=5, shuffle=False)
        grid_search = GridSearchCV(
            pipeline, param_grid
            , cv=skf, scoring="recall"
        )
        grid_search.fit(X_train, y_train)
        # Hyperparameter tuning complete
        logging.info("Hyperparameter tuning complete.")

        # Show best parameters for the model
        best_params = grid_search.best_params_
        mlflow.log_params(grid_search.best_params_)
        logging.info(f"Logged parameters: {best_params}")

        # Train the model with the best parameters
        model = grid_search.best_estimator_
        logging.info("Training the model with the best parameters...")
        model.fit(X_train, y_train)
        logging.info("Model training complete.")

        # Make predictions and evaluate
        y_pred = model.predict(X_test)


        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        metrics = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        }
        mlflow.log_metrics(metrics)
        logging.info(f"Logged metrics: {metrics}")
        
        #automatically determine the input and output schema
        signature = mlflow.models.infer_signature(X_train, model.predict(X_train))
        
        logging.info("Logging model to MLflow Registry...")
        mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud_detection_with_lightgbm"
        )
        logging.info("Model trained and registered successfully.")

if __name__ == "__main__":
    main()