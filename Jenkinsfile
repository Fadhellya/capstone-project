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
                echo "Memulai proses build dan training ulang untuk proyek '${COMPOSE_PROJECT_NAME}'..."
                
                // --- PERINTAH YANG DIPERBAIKI ---
                // Kita mendefinisikan variabel DATA_DIR dengan path absolut dari workspace Jenkins,
                // lalu menjalankannya dalam satu blok 'sh'.
                sh '''
                    export DATA_DIR=${WORKSPACE}/data
                    echo "Data directory path is set to: ${DATA_DIR}"
                    docker compose --project-name ${COMPOSE_PROJECT_NAME} run --build --rm model_trainer
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}

