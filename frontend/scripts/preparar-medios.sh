#!/usr/bin/env bash
# Genera los medios de video de la portada a partir de los archivos fuente.
#
#   scripts/preparar-medios.sh <video-parques-nacionales.mp4>
#
# Video en bucle de la portada: siete tomas limpias de paisaje del video
# institucional, unidas con fundidos, sin audio, en H.264 con faststart, más
# su póster. Se generan dos tamaños: 720p para escritorio y 480p para
# celulares; la portada elige según el ancho de la pantalla.
#
# Los resultados quedan en public/media/, que no se versiona hasta confirmar
# los derechos de uso de los videos fuente.
set -euo pipefail

VIDEO_PNN="${1:?Falta la ruta del video de Parques Nacionales}"
SALIDA="$(dirname "$0")/../public/media"

mkdir -p "$SALIDA"

# Inicio (s) de cada toma limpia: laguna, bosque, frailejones, laguna, pastos, flores.
TOMAS=(17 77 92 99 274 290 439)
DURACION=3.8
FUNDIDO=0.7
entradas=()
filtro=""
for i in "${!TOMAS[@]}"; do
  entradas+=(-ss "${TOMAS[$i]}" -t "$DURACION" -i "$VIDEO_PNN")
  filtro+="[$i:v]scale=1280:720:flags=lanczos,setsar=1,fps=24,format=yuv420p[v$i];"
done
anterior="v0"
for i in $(seq 1 $((${#TOMAS[@]} - 1))); do
  desfase=$(awk "BEGIN { print $i * ($DURACION - $FUNDIDO) }")
  filtro+="[$anterior][v$i]xfade=transition=fade:duration=$FUNDIDO:offset=$desfase[x$i];"
  anterior="x$i"
done

ffmpeg -v error "${entradas[@]}" -filter_complex "${filtro%;}" -map "[$anterior]" -an \
  -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  "$SALIDA/chingaza-paisajes.mp4" -y
ffmpeg -v error "${entradas[@]}" -filter_complex "${filtro%;};[$anterior]scale=-2:480:flags=lanczos[p480]" -map "[p480]" -an \
  -c:v libx264 -preset slow -crf 29 -profile:v main -pix_fmt yuv420p -movflags +faststart \
  "$SALIDA/chingaza-paisajes-480.mp4" -y
ffmpeg -v error -ss 0.5 -i "$SALIDA/chingaza-paisajes.mp4" -frames:v 1 -q:v 4 "$SALIDA/chingaza-paisajes.jpg" -y

echo "Listo: video en bucle en $SALIDA"
