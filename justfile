set shell := ["nu", "-c"]

watch:
    npm run tauri dev

build:
    npm run tauri build

prettier:
    npx prettier --write .