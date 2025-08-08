import os
import logging
import mlflow
import pandas as pd
from imblearn.over_sampling import SMOTENC
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def main():
    # 1. Load and Prepare Data
    logging.info("Loading and preparing data")
    data = pd.read_csv('../data/fraud_detection.csv')
    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset loaded and split successfully.")

    # Identify categorical features
    categorical_features = [i for i, col in enumerate(X_train.columns) if X_train[col].dtype == 'object']

    # 2. Handle Imbalanced Data with SMOTE, if needed.
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

    # 3. Set MLflow Tracking URI
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    # 4. Define Model Pipeline and Hyperparameter Grid
    base_model = RandomForestClassifier(random_state=42)

    preprocessor = ColumnTransformer(
        [('onehot', OneHotEncoder(handle_unknown='ignore'), categorical_features)],
        remainder='passthrough'
    ) #OneHotEncoder is used to handle categorical features

    # Define machine learning pipeline
    pipeline = Pipeline([
        'preporcessor', preprocessor,
        'model', base_model
    ])

    # Define hyperparameter grid to tune
    param_grid = {'model__n_estimators': [50, 100, 250, 500]
        , 'model__min_samples_leaf': [1, 2, 5]
        , 'model__min_samples_split': [10, 25, 50, 100]
    }
    skf = StratifiedKFold(shuffle=False, n_splits=5)

    # 5. Start MLflow Run for Training and Logging
    with mlflow.start_run(run_name="Model Training") as run:
        run_id = run.info.run_id
        logging.info(f"MLflow run started. Run ID: {run_id}")
        
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
        report = classification_report(y_test, y_pred, output_dict=True)
        
        # Logging model metrics
        mlflow.log_metrics({
            'accuracy': report['accuracy'],
            'recall_fraud': report['1']['recall'],
            'precision_fraud': report['1']['precision'],
            'f1_score_macro': report['macro avg']['f1-score']
        })
        logging.info(f"Logged metrics: {metrics}")

        #automatically determine the input and output schema
        signature = mlflow.models.infer_signature(X_train, model.predict(X_train))

        # Log the model artifact
        mlflow.sklearn.log_model(
            sk_model=model,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud_detection_model_with_random_forest"
        )
        
        print(f"--- Run completed. Run ID: {run.info.run_id} ---")

if __name__ == "__main__":
    main()
