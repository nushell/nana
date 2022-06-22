set shell := ["nu", "-c"]

# List available commands by default
default:
  @just --list --list-prefix "··· "

# Install node dependencies
setup:
    yarn install

# Run dev in watch mode
watch:
    yarn tauri dev

# Code formatting
prettier:
    yarn prettier
    cd src-tauri/; cargo fmt --all

# Remove the target directory
clean:
    cd src-tauri; cargo clean

# Build a release version of Nana
build:
    yarn tauri build --config `{ "tauri": { "bundle": { "active": false }}}`

# Build release version and create an installer/package/bundle
publish:
    yarn tauri build --config `{ "tauri": { "bundle": { "active": true }}}`
