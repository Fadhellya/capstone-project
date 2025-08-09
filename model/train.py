import os
import pandas as pd
import mlflow
import mlflow.sklearn
from imblearn.over_sampling import SMOTENC
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold
from sklearn.model_selection import GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report

def main():
    # --- PENYESUAIAN PENTING DI SINI ---
    # Path ini adalah path RELATIF di dalam kontainer,
    # karena direktori kerja kita adalah /app dan data di-mount ke /app/data.
    data_path = "fraud_detection.csv"

    # 1. Load and Prepare Data
    print(f"--- Loading and preparing data from '{data_path}' ---")
    try:
        raw = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: Data file not found at '{data_path}'.")
        print("Please ensure the volume mount in docker-compose.yaml is correct.")
        exit(1) # Keluar dari skrip jika data tidak ditemukan

    raw = raw.drop('transaction_id', axis=1)

    categorical_features = ['merchant_type', 'device_type']
    numerical_features = ['amount']
    independent_var = categorical_features + numerical_features

    X_train, X_test, y_train, y_test = train_test_split(
        raw[independent_var], raw['label'],
        test_size=0.2, random_state=42, stratify=raw['label']
    )

    # 2. Handle Imbalanced Data with SMOTE
    print("--- Applying SMOTE ---")
    sm = SMOTENC(
        categorical_features=categorical_features,
        random_state=42,
        sampling_strategy=0.4
    )
    X_res, y_res = sm.fit_resample(X_train, y_train)

    # 3. Set MLflow Tracking URI
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    # 4. Define Model Pipeline and Hyperparameter Grid
    preprocessor = ColumnTransformer([
        ('scaler', StandardScaler(), numerical_features),
        ('onehot', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

    pipeline_logreg = Pipeline([
        ('Preprocessing_Column', preprocessor),
        ('Logistic Regression', LogisticRegression(random_state=42, multi_class='ovr', penalty=None))
    ])

    param_logreg = {'Logistic Regression__solver': ['lbfgs', 'newton-cg', 'sag']}
    skf = StratifiedKFold(shuffle=False, n_splits=5)

    # 5. Start MLflow Run for Training and Logging
    print("--- Starting MLflow run ---")
    with mlflow.start_run(run_name="Logistic Regression Hyperparameter Tuning") as run:
        gs_logreg = GridSearchCV(
            pipeline_logreg,
            param_logreg,
            cv=skf,
            scoring="recall"
        )
        gs_logreg.fit(X_res, y_res)
        best_model = gs_logreg.best_estimator_
        
        # Log parameters and metrics
        mlflow.log_params(gs_logreg.best_params_)
        
        y_pred = best_model.predict(X_test)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        mlflow.log_metrics({
            'accuracy': report['accuracy'],
            'recall_fraud': report['1']['recall'],
            'precision_fraud': report['1']['precision'],
            'f1_score_macro': report['macro avg']['f1-score']
        })

        # Log the model artifact
        print("--- Logging model artifact ---")
        mlflow.sklearn.log_model(
            sk_model=best_model,
            artifact_path="model",
            registered_model_name="fraud-detection-model"
        )
        
        print(f"--- Run completed. Run ID: {run.info.run_id} ---")

if __name__ == "__main__":
    main()
