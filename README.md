# Project "Nana"

An experimental GUI version of Nushell:

![image](https://user-images.githubusercontent.com/26268125/188325453-aafe7397-6773-4821-ba28-561f21703d8a.png)

## Dependencies

First, install the dependencies in order to build the project. You'll need, at least:

- [`Yarn`](https://yarnpkg.com/)
- [`Node`](https://nodejs.org/en/)

Once Yarn and Node have been installed, you can run: `yarn install`.

Finally, you can optionally install [`just`](https://github.com/casey/just).

Since, `Nana` relies on Tauri to run the application, additional dependencies are required depending
of your current operating system.

### Linux

[`Linux dependencies`](https://tauri.app/v1/guides/getting-started/prerequisites/#setting-up-linux)

### MacOS

[`MacOS dependencies`](https://tauri.app/v1/guides/getting-started/prerequisites/#setting-up-macos)

### Windows

[`Windows dependencies`](https://tauri.app/v1/guides/getting-started/prerequisites/#setting-up-windows)

## Getting started

To start the project, run `yarn tauri dev`. If you use [`just`](https://github.com/casey/just),
`just watch` and `just build`, **and run `just` will show all the available commands**.

last, but not least, to build a release, just run: `yarn tauri build`.
