// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Memberitahu Jenkins untuk membangun dan menggunakan Dockerfile dari folder 'jenkins'
    // sebagai agent untuk menjalankan pipeline ini.
    agent {
        dockerfile {
            dir 'jenkins'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
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
                // Langkah ini sekarang berjalan di dalam kontainer agent yang baru dibangun
                checkout scm
            }
        }

        stage('Build and Run Retraining') {
            steps {
                echo "Workspace is at: ${env.WORKSPACE}"
                echo "Running docker compose for project '${env.COMPOSE_PROJECT_NAME}'..."
                
                // Pisahkan perintah build dan run untuk kompatibilitas yang lebih baik.
                echo "Building the model trainer image..."
                sh 'docker compose build model_trainer'
                
                echo "Running the model training..."
                sh 'docker compose run --rm model_trainer'
            }
        }
    }

    post {
        // Bagian ini akan dijalankan HANYA jika semua tahap di atas berhasil.
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
