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
        // --- PERBAIKAN PENTING DI SINI ---
        // Bagian ini akan dijalankan HANYA jika semua tahap di atas berhasil.
        // Menghapus blok 'steps' yang tidak perlu.
        success {
            echo 'Training successful. Triggering model refresh on the API...'
            // Menjalankan perintah curl dari dalam kontainer sementara yang terhubung
            // ke jaringan yang sama dengan aplikasi Anda.
            sh 'docker run --rm --network=capstone-project_mlops_network curlimages/curl:latest -X POST http://fastapi_app:8000/refresh-model'
        }
        
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
