#!/usr/bin/env bash
# Importa fotos y videos propios de Eco Palacio Tur a la biblioteca de la web.
#
#   scripts/importar-biblioteca.sh <carpeta> [categoria]
#
# <carpeta>: por ejemplo, la exportación oficial de Instagram descomprimida
# (Configuración → Tu actividad → Descargar tu información). Se recorre
# completa buscando imágenes (jpg, jpeg, png, webp) y videos (mp4, mov).
# [categoria]: Paisaje, Flora, Fauna o Experiencias (por defecto Experiencias).
#
# Cada foto se guarda en WebP de 1600 px y 720 px, sin metadatos; cada video
# en H.264 de 720 px sin audio, con su póster. El catálogo queda en
# public/biblioteca/biblioteca.json: ahí se pueden ajustar textos alternativos
# y categorías a mano. Volver a ejecutar el script reemplaza el catálogo.
set -euo pipefail

ORIGEN="${1:?Indica la carpeta con las fotos y videos}"
CATEGORIA="${2:-Experiencias}"
case "$CATEGORIA" in Paisaje|Flora|Fauna|Experiencias) ;; *) echo "Categoría no válida: $CATEGORIA" >&2; exit 1 ;; esac

DESTINO="$(cd "$(dirname "$0")/.." && pwd)/public/biblioteca"
ARCHIVOS="$DESTINO/propias"
CATALOGO="$DESTINO/biblioteca.json"
mkdir -p "$ARCHIVOS"

dimensiones() { ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$1" | tr 'x' ' '; }
identificador() {
  local base hash
  base=$(basename "$1" | sed 's/\.[^.]*$//' | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-40)
  hash=$(printf '%s' "$1" | md5sum | cut -c1-6)
  printf '%s-%s' "${base:-medio}" "$hash"
}

entradas=()
total=0
while IFS= read -r -d '' archivo; do
  id=$(identificador "$archivo")
  extension="${archivo##*.}"
  extension="${extension,,}"
  if [[ "$extension" == mp4 || "$extension" == mov ]]; then
    ffmpeg -v error -i "$archivo" -an -map_metadata -1 -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 26 \
      -pix_fmt yuv420p -movflags +faststart "$ARCHIVOS/$id.mp4" -y
    ffmpeg -v error -ss 0.5 -i "$ARCHIVOS/$id.mp4" -frames:v 1 -q:v 4 "$ARCHIVOS/$id.jpg" -y
    read -r ancho alto < <(dimensiones "$ARCHIVOS/$id.mp4")
    entradas+=("{\"id\":\"$id\",\"tipo\":\"video\",\"src\":\"/biblioteca/propias/$id.mp4\",\"miniatura\":\"/biblioteca/propias/$id.jpg\",\"ancho\":$ancho,\"alto\":$alto,\"alt\":\"Video de Eco Palacio Tur en el páramo de Chingaza\",\"categoria\":\"$CATEGORIA\",\"credito\":\"Eco Palacio Tur\",\"licencia\":\"Propia\",\"propio\":true}")
  else
    ffmpeg -v error -i "$archivo" -map_metadata -1 -vf "scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease" -quality 80 "$ARCHIVOS/$id.webp" -y
    ffmpeg -v error -i "$archivo" -map_metadata -1 -vf "scale='min(720,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" -quality 74 "$ARCHIVOS/$id-720.webp" -y
    read -r ancho alto < <(dimensiones "$ARCHIVOS/$id.webp")
    entradas+=("{\"id\":\"$id\",\"tipo\":\"foto\",\"src\":\"/biblioteca/propias/$id.webp\",\"miniatura\":\"/biblioteca/propias/$id-720.webp\",\"ancho\":$ancho,\"alto\":$alto,\"alt\":\"Foto de Eco Palacio Tur en el páramo de Chingaza\",\"categoria\":\"$CATEGORIA\",\"credito\":\"Eco Palacio Tur\",\"licencia\":\"Propia\",\"propio\":true}")
  fi
  total=$((total + 1))
  echo "  $total · $(basename "$archivo")"
done < <(find "$ORIGEN" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.mp4' -o -iname '*.mov' \) -print0 | sort -z)

{
  echo "["
  for i in "${!entradas[@]}"; do
    [[ $i -gt 0 ]] && echo ","
    printf '  %s' "${entradas[$i]}"
  done
  echo
  echo "]"
} > "$CATALOGO"

echo "Listo: $total medios importados en $ARCHIVOS. Revisa textos y categorías en $CATALOGO."
