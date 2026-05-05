export const GLOBAL_UPLOAD_RULES = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB — más realista para Excel/PPT pesados
  ALLOWED_MIME_TYPES: [
    // ─── Documentos ───────────────────────────────────────────
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.oasis.opendocument.text', // .odt
    'text/plain', // .txt
    'text/markdown', // .md
    'application/rtf', // .rtf

    // ─── Hojas de cálculo ─────────────────────────────────────
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'text/csv', // .csv
    'text/tab-separated-values', // .tsv

    // ─── Presentaciones ───────────────────────────────────────
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.oasis.opendocument.presentation', // .odp

    // ─── Datos estructurados ──────────────────────────────────
    'application/json', // .json
    'application/xml', // .xml
    'text/xml', // .xml (alt)

    // ─── Imágenes ─────────────────────────────────────────────
    'image/jpeg', // .jpg/.jpeg
    'image/png', // .png
    'image/gif', // .gif
    'image/webp', // .webp
    'image/svg+xml', // .svg
    'image/avif', // .avif
    'image/tiff', // .tiff
    'image/bmp', // .bmp

    // ─── Comprimidos ──────────────────────────────────────────
    'application/zip', // .zip
    'application/x-rar-compressed', // .rar
    'application/x-7z-compressed', // .7z
  ],
};
