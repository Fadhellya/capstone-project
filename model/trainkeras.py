import logging
import mlflow
import pandas as pd
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
    """
    Mendefinisikan dan meng-compile neural network Keras sederhana.
    Argumen meta dibutuhkan oleh wrapper scikeras.
    """
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
    """Fungsi utama untuk melatih, mengevaluasi, dan mencatat model."""
    logging.info("Memulai proses training...")

    data_path = "fraud_detection.csv"
    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"FATAL ERROR: File data tidak ditemukan di '{data_path}'.")
        exit(1)

    X = data.drop(columns=['label','transaction_id'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logging.info("Dataset berhasil dimuat dan dibagi.")

    categorical_features = [col for col in X_train.columns if X_train[col].dtype == 'object']
    numerical_features = [col for col in X_train.columns if X_train[col].dtype != 'object']

    if y_train.value_counts(normalize=True).min() < 0.4:
        logging.info("Menerapkan resampling SMOTENC.")
        sm = SMOTENC(categorical_features=categorical_features, random_state=42, sampling_strategy=0.4)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    # Definisikan pipeline pra-pemrosesan
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    mlflow.set_tracking_uri("http://mlflow_server:5001")
    mlflow.set_experiment("fraud_detection_experiment")

    with mlflow.start_run(run_name="fraud_detection_keras_pipeline_training") as run:
        logging.info(f"MLflow run dimulai. Run ID: {run.info.run_id}")

        # Bungkus model Keras agar bisa digunakan di dalam Pipeline Scikit-learn
        keras_estimator = KerasClassifier(
            model=create_keras_model,
            epochs=20,
            batch_size=32,
            verbose=0
        )

        # Buat pipeline Scikit-learn yang lengkap
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', keras_estimator)
        ])

        # --- PENYESUAIAN PENTING ---
        # Latih seluruh pipeline dari awal hingga akhir.
        # Scikit-learn akan secara otomatis menangani pra-pemrosesan
        # sebelum melatih model Keras.
        logging.info("Melatih pipeline Keras...")
        pipeline.fit(X_train, y_train)
        logging.info("Pelatihan model selesai.")

        # Evaluasi model
        y_pred = pipeline.predict(X_test)

        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred)
        }
        mlflow.log_metrics(metrics)
        logging.info(f"Metrik akhir yang dicatat: {metrics}")
        
        # Dapatkan signature dan catat seluruh pipeline ke registry
        signature = mlflow.models.infer_signature(X_train, pipeline.predict(X_train))
        logging.info("Mencatat pipeline model ke MLflow Registry...")
        mlflow.sklearn.log_model(
            sk_model=pipeline,
            artifact_path="model",
            signature=signature,
            registered_model_name="fraud-detection-model"
        )
        logging.info("Model berhasil dilatih dan didaftarkan.")

if __name__ == "__main__":
    main()
