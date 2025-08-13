# Gunakan image Nginx resmi yang ringan untuk menyajikan file statis
FROM nginx:alpine

# Salin file index.html ke direktori root web server Nginx
COPY index.html /usr/share/nginx/html/index.html

# Ekspos port 80, port default Nginx
EXPOSE 80
