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

def main():
    """Main function to train, evaluate, and log the model."""
    logging.info("Starting the training process...")

    data_path = "data/fraud_detection.csv"

    # Load the dataset
    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: Data file not found at '{data_path}'.")
        print("Please ensure the volume mount in docker-compose.yaml is correct.")
        exit(1)

    # Split the data
    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset loaded and split successfully.")

    # Identify categorical features by name for SMOTENC
    categorical_feature_names = [col for col in X_train.columns if X_train[col].dtype == 'object']
    
    # Identify categorical features by index for ColumnTransformer
    categorical_feature_indices = [i for i, col in enumerate(X_train.columns) if X_train[col].dtype == 'object']


    # Check for class imbalance and resample if needed
    imbalance_threshold = 0.4
    class_counts = y_train.value_counts(normalize=True)
    logging.info(f"Class distribution before resampling:\n{class_counts}")
    minority_ratio = class_counts.min()

    if minority_ratio < imbalance_threshold:
        logging.info("Class imbalance detected. Applying SMOTENC resampling.")
        sm = SMOTENC(categorical_features=categorical_feature_names, random_state=42, sampling_strategy=0.4)
        X_train, y_train = sm.fit_resample(X_train, y_train)
        logging.info("Resampling completed using SMOTENC.")
    else:
        logging.info("No significant class imbalance detected. Proceeding without resampling.")

    # Configure connection to the MLflow Tracking Server
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    with mlflow.start_run(run_name="fraud_detection_lgbm_training") as run:
        run_id = run.info.run_id
        logging.info(f"MLflow run started. Run ID: {run_id}")

        # --- PENYESUAIAN PENTING ---
        # Define parameter grid for LightGBMClassifier
        param_grid = {
            'model__boosting_type': ['gbdt', 'dart'],
            'model__n_estimators': [100, 200],
            'model__num_leaves': [31, 64]
        }
        
        # Use LGBMClassifier as the base model
        base_model = LGBMClassifier(random_state=42)

        # Define the preprocessing pipeline
        preprocessor = ColumnTransformer(
            [('onehot', OneHotEncoder(handle_unknown='ignore'), categorical_feature_indices)],
            remainder='passthrough'
        )

        # Create the full pipeline
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', base_model)
        ])

        # Hyperparameter tuning with GridSearchCV
        skf = StratifiedKFold(n_splits=5, shuffle=False)
        grid_search = GridSearchCV(
            pipeline, param_grid, cv=skf, scoring="recall"
        )
        grid_search.fit(X_train, y_train)
        logging.info("Hyperparameter tuning complete.")

        # Log best parameters for the model
        best_params = grid_search.best_params_
        mlflow.log_params(best_params)
        logging.info(f"Logged parameters: {best_params}")

        # Train the model with the best parameters
        model = grid_search.best_estimator_
        logging.info("Training the model with the best parameters...")
        model.fit(X_train, y_train)
        logging.info("Model training complete.")

        # Make predictions and evaluate
        y_pred = model.predict(X_test)

        # Log the metrics
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, average='weighted'),
            "recall": recall_score(y_test, y_pred, average='weighted'),
            "f1_score": f1_score(y_test, y_pred, average='weighted')
        }
        mlflow.log_metrics(metrics)
        logging.info(f"Logged metrics: {metrics}")
        
        # Infer the model signature
        signature = mlflow.models.infer_signature(X_train, model.predict(X_train))
        
        logging.info("Logging model to MLflow Registry...")
        mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud-detection-model"
        )
        logging.info("Model trained and registered successfully.")

if __name__ == "__main__":
    main()
