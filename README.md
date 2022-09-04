# Project "Nana"

An experimental GUI version of Nushell:

![image](https://user-images.githubusercontent.com/26268125/188325453-aafe7397-6773-4821-ba28-561f21703d8a.png)

## Getting started

- `yarn install`
- `yarn tauri dev` (or to build a release: `yarn tauri build`)
- If you use [`just`](https://github.com/casey/just), `just watch` and `just build`, **and run `just` will show all the available commands**

## Dependencies

debian

```
sudo apt install libwebkit2gtk-4.0-dev libjavascriptcoregtk-4.0-dev libsoup2.4-dev
```

arch linux

```
sudo pacman -S webkit2gtk libsoup
```
