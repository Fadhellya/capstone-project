// Jenkinsfile (Declarative Pipeline)

pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // Ganti '988' dengan ID grup Docker Anda jika berbeda.
        DOCKER_GROUP_ID = '988'
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build and Run Retraining') {
            steps {
                // --- PERBAIKAN PENTING DI SINI ---
                // Gunakan 'withEnv' untuk mengatur variabel lingkungan secara andal
                // untuk langkah-langkah di dalamnya.
                withEnv(["DATA_DIR=${env.WORKSPACE}/data"]) {
                    echo "Memulai proses build dan training ulang..."
                    echo "DATA_DIR is set to: ${env.DATA_DIR}"
                    
                    // Jalankan docker compose. Ia akan secara otomatis menggunakan
                    // variabel DATA_DIR yang baru saja kita atur.
                    sh 'docker compose --project-name ${COMPOSE_PROJECT_NAME} run --build --rm model_trainer'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
