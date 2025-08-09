// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Menentukan di mana pipeline ini akan berjalan. 'any' berarti di agent Jenkins manapun.
    agent any

    // Opsi untuk pipeline
    options {
        // Menetapkan batas waktu eksekusi pipeline selama 30 menit.
        timeout(time: 30, unit: 'MINUTES')
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
        // Perintah 'run' akan secara otomatis membangun image jika ada perubahan.
        stage('Build and Run Retraining') {
            steps {
                echo 'Memulai proses build dan training ulang model...'
                // Menggunakan 'docker compose' (dengan spasi) yang merupakan sintaks modern.
                // Perintah ini akan membangun image jika perlu, lalu menjalankan training.
                sh 'docker compose run --build --rm model_trainer'
            }
        }
    }

    // Bagian 'post' akan selalu dijalankan setelah semua tahap selesai
    post {
        // 'always' berarti akan selalu dijalankan, baik pipeline berhasil maupun gagal.
        always {
            echo 'Pipeline retraining selesai.'
            // Anda bisa menambahkan langkah notifikasi di sini,
            // misalnya mengirim email atau pesan ke Slack.
        }
    }
}
