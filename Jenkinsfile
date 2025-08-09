// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Menentukan di mana pipeline ini akan berjalan. 'any' berarti di agent Jenkins manapun.
    agent any

    // Opsi untuk pipeline
    options {
        // Menetapkan batas waktu eksekusi pipeline selama 30 menit.
        timeout(time: 30, unit: 'MINUTES')
    }

    // Mendefinisikan variabel lingkungan untuk pipeline ini
    environment {
        // Ganti '988' dengan ID grup Docker Anda jika berbeda. Cek dengan 'getent group docker'
        DOCKER_GROUP_ID = '988'
        
        // Menetapkan nama proyek Docker Compose secara eksplisit
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        // Tahap 1: Mengambil kode terbaru dari Git
        stage('Checkout Code') {
            steps {
                // 'checkout scm' adalah langkah standar Jenkins untuk melakukan git clone/pull.
                checkout scm
            }
        }

        // Tahap 2: Membangun Image dan Menjalankan Training
        stage('Build and Run Retraining') {
            steps {
                echo "Memulai proses build dan training ulang untuk proyek '${COMPOSE_PROJECT_NAME}'..."
                
                // --- LANGKAH DEBUGGING ---
                // Mencetak direktori kerja saat ini di dalam workspace Jenkins
                echo "Current working directory is:"
                sh 'pwd'
                
                // Mencetak daftar file di direktori kerja untuk memastikan folder 'data' ada
                echo "Files in current directory are:"
                sh 'ls -la'
                // --- AKHIR LANGKAH DEBUGGING ---

                // Menjalankan 'run' dengan nama proyek yang benar.
                // Jenkins sekarang akan terhubung ke jaringan dan service yang sudah ada.
                sh 'docker compose --project-name ${COMPOSE_PROJECT_NAME} run --build --rm model_trainer'
            }
        }
    }

    // Bagian 'post' akan selalu dijalankan setelah semua tahap selesai
    post {
        // 'always' berarti akan selalu dijalankan, baik pipeline berhasil maupun gagal.
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}

