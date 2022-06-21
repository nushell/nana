set shell := ["nu", "-c"]

setup:
    yarn install

watch:
    yarn tauri dev

# Build a release version of Nana
build:
    yarn tauri build --config `{ "tauri": { "bundle": { "active": false }}}`

# Build release version and create an installer/package/bundle
publish:
    yarn tauri build --config `{ "tauri": { "bundle": { "active": true }}}`
