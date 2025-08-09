// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Jalankan pipeline ini di dalam sebuah kontainer Docker sementara.
    agent {
        docker {
            // Gunakan image yang sudah memiliki 'docker compose'
            image 'docker/compose:latest'
            
            // Mount docker.sock dan workspace Jenkins
            args '-v /var/run/docker.sock:/var/run/docker.sock -v ${WORKSPACE}:${WORKSPACE}'
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // Ganti '988' dengan ID grup Docker Anda jika berbeda.
        DOCKER_GROUP_ID = '988'
        // Docker Compose akan secara otomatis menggunakan variabel ini sebagai nama proyek.
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Langkah ini sekarang berjalan di dalam kontainer agent
                checkout scm
            }
        }

        stage('Build and Run Retraining') {
            steps {
                echo "Workspace is at: ${env.WORKSPACE}"
                echo "Running docker compose for project '${env.COMPOSE_PROJECT_NAME}'..."
                
                // --- PERINTAH YANG DIPERBAIKI ---
                // Pisahkan perintah build dan run menjadi dua langkah terpisah
                // untuk kompatibilitas yang lebih baik.
                echo "Building the model trainer image..."
                sh 'docker compose build model_trainer'
                
                echo "Running the model training..."
                sh 'docker compose run --rm model_trainer'
            }
        }
    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
