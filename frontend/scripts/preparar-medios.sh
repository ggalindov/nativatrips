#!/usr/bin/env bash
# Genera los medios de video de la portada a partir de los archivos fuente.
#
#   scripts/preparar-medios.sh <video-360.mp4> <video-parques-nacionales.mp4>
#
# 1. Secuencia del descenso: detecta y recorta las franjas negras del video
#    panorámico, lo reduce a 1440 px, interpola a 120 fps (estimación de
#    movimiento) y lo exporta como cuadros WebP con su manifest.json.
# 2. Video en bucle: siete tomas limpias de paisaje del video institucional,
#    unidas con fundidos, sin audio, en H.264 con faststart, más su póster.
#
# Los resultados quedan en public/media/, que no se versiona hasta confirmar
# los derechos de uso de los videos fuente.
set -euo pipefail

VIDEO_360="${1:?Falta la ruta del video 360}"
VIDEO_PNN="${2:?Falta la ruta del video de Parques Nacionales}"
SALIDA="$(dirname "$0")/../public/media"
SECUENCIA="$SALIDA/descenso"

mkdir -p "$SECUENCIA"
rm -f "$SECUENCIA"/*.webp

FPS=120
# Recorte más frecuente que propone cropdetect (franjas negras de cine).
RECORTE=$(ffmpeg -hide_banner -i "$VIDEO_360" -vf "cropdetect=limit=24:round=2:reset=0" -an -f null - 2>&1 \
  | grep -o 'crop=[0-9:]*' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')

ffmpeg -v error -i "$VIDEO_360" -an \
  -vf "${RECORTE},scale=1440:-2:flags=lanczos,minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -c:v libwebp -quality 50 -compression_level 5 "$SECUENCIA/%04d.webp" -y

total=$(ls "$SECUENCIA"/*.webp | wc -l)
read -r ancho alto < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=' ' "$SECUENCIA/0001.webp")
printf '{"total": %d, "ancho": %d, "alto": %d, "fps": %d}\n' "$total" "$ancho" "$alto" "$FPS" > "$SECUENCIA/manifest.json"

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
  -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  "$SALIDA/chingaza-paisajes.mp4" -y
ffmpeg -v error -ss 0.5 -i "$SALIDA/chingaza-paisajes.mp4" -frames:v 1 -q:v 4 "$SALIDA/chingaza-paisajes.jpg" -y

echo "Listo: $total cuadros en $SECUENCIA y video en bucle en $SALIDA"
