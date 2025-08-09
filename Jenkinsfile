// Jenkinsfile (Declarative Pipeline)

pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // Ganti '988' dengan ID grup Docker Anda jika berbeda. Cek dengan 'getent group docker'
        DOCKER_GROUP_ID = '988'
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // --- TAHAP BARU: Menyiapkan Konfigurasi Jenkins ---
        stage('Prepare Jenkins Environment') {
            steps {
                echo "Creating docker-compose.override.yml for Jenkins workspace..."
                // Perintah ini membuat file override yang akan digunakan oleh docker-compose.
                // Ini secara eksplisit memberitahu untuk me-mount folder 'data' dari workspace Jenkins.
                writeFile file: 'docker-compose.override.yml', text: """
services:
  model_trainer:
    volumes:
      - ${env.WORKSPACE}/data:/app/data
"""
                echo "Override file created:"
                sh 'cat docker-compose.override.yml'
            }
        }

        stage('Build and Run Retraining') {
            steps {
                echo "Memulai proses build dan training ulang untuk proyek '${COMPOSE_PROJECT_NAME}'..."
                
                // Docker Compose akan secara otomatis menggunakan file override yang baru dibuat.
                sh 'docker compose --project-name ${COMPOSE_PROJECT_NAME} run --build --rm model_trainer'
            }
        }
    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
            // Membersihkan file override setelah selesai
            deleteDir()
        }
    }
}
