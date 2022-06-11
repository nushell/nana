#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use parking_lot::Mutex;

use nu_cli::gather_parent_env_vars;
use nu_protocol::{
    engine::{EngineState, Stack, StateWorkingSet},
    CliError, PipelineData, Span, Value,
};
use tauri::{command, Manager, State};

pub struct MyState {
    engine_state: Mutex<EngineState>,
    stack: Mutex<Stack>,
}

mod nushell;
mod run_external;

#[cfg(target_os = "windows")]
mod windows_utils;

fn main() {
    let cwd = std::env::current_dir().unwrap();
    let mut engine_state = nu_command::create_default_context(&cwd);

    let delta = {
        let mut working_set = StateWorkingSet::new(&engine_state);

        macro_rules! bind_command {
            ( $( $command:expr ),* $(,)? ) => {
                $( working_set.add_decl(Box::new($command)); )*
            };
        }

        bind_command!(crate::run_external::External);

        working_set.render()
    };
    let _ = engine_state.merge_delta(delta, None, &cwd);

    gather_parent_env_vars(&mut engine_state);

    let stack = Stack::new();

    tauri::Builder::default()
        .manage(MyState {
            engine_state: Mutex::new(engine_state),
            stack: Mutex::new(stack),
        })
        .invoke_handler(tauri::generate_handler![
            simple_command_with_result,
            get_working_directory
        ])
        // Disabling the menu to make the UI cleaner; can always re-enable it if we think of useful menu items to add
        // .menu(
        //     Menu::new()
        //         .add_submenu(Submenu::new(
        //             "Nushell",
        //             Menu::new()
        //                 .add_native_item(MenuItem::EnterFullScreen)
        //                 .add_native_item(MenuItem::Quit),
        //         ))
        //         .add_submenu(Submenu::new(
        //             "Edit",
        //             Menu::new()
        //                 .add_native_item(MenuItem::Copy)
        //                 .add_native_item(MenuItem::Paste)
        //                 .add_native_item(MenuItem::Cut)
        //                 .add_native_item(MenuItem::Undo)
        //                 .add_native_item(MenuItem::Redo)
        //                 .add_native_item(MenuItem::SelectAll),
        //         )),
        // )
        .setup(|app| {
            if let Some(main_window) = app.get_window("main") {
                try_set_titlebar_colors(&main_window);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Set the colors of the titlebar to match the current light/dark theme
// TODO: pass in RGB colors as args, implement for more OSs, call this when OS theme changes
fn try_set_titlebar_colors(window: &tauri::Window) {
    #[cfg(target_os = "windows")]
    {
        use std::{ffi::c_void, mem::size_of};
        use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_CAPTION_COLOR};

        // Note: this is a COLORREF, BGR (0x00bbggrr) not RGB
        let bg_color = if windows_utils::is_dark_theme_active() {
            0x00362b00 // Solarized Dark base03
        } else {
            0x00e3f6fd // Solarized Light base3
        };

        if let Ok(hwnd) = window.hwnd() {
            let bg_ptr: *const i32 = &bg_color;
            unsafe {
                // Set titlebar background color
                let _ = DwmSetWindowAttribute(
                    hwnd,
                    DWMWA_CAPTION_COLOR,
                    bg_ptr as *const c_void,
                    size_of::<i32>() as u32,
                );
                // TODO: set title text with DWMWA_TEXT_COLOR
                // but the defaults of black+white are OK for now
            }
        }
    }
}

#[command]
fn simple_command_with_result(argument: String, state: State<MyState>) -> Result<String, String> {
    let mut engine_state = state.engine_state.lock();
    let mut stack = state.stack.lock();
    let result = nushell::eval_nushell(
        &mut engine_state,
        &mut stack,
        argument.as_bytes(),
        "nana",
        PipelineData::new(Span { start: 0, end: 0 }),
    );

    let result = result.map(|x| x.into_value(Span { start: 0, end: 0 }));

    match result {
        Ok(Value::Error { error: e }) => {
            let working_set = StateWorkingSet::new(&engine_state);

            let error_msg = format!("{:?}", CliError(&e, &working_set));

            Err(String::from_utf8_lossy(error_msg.as_bytes()).to_string())
        }
        Ok(value) => {
            let output = serde_json::to_string(&value);

            match output {
                Ok(s) => Ok(s),
                Err(e) => Ok(format!("\"{}\"", e)),
            }
        }
        Err(e) => {
            let working_set = StateWorkingSet::new(&engine_state);

            let error_msg = format!("{:?}", CliError(&e, &working_set));

            Err(String::from_utf8_lossy(error_msg.as_bytes()).to_string())
        }
    }
}

#[command]
fn get_working_directory(state: State<MyState>) -> Result<String, String> {
    let engine_state = state.engine_state.lock();
    let stack = state.stack.lock();
    let cwd = nu_engine::env::current_dir_str(&engine_state, &stack);

    match cwd {
        Ok(s) => Ok(s),
        Err(e) => Ok(format!("\"{}\"", e)),
    }
}
