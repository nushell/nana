use std::{ffi::OsString, os::windows::prelude::OsStrExt};
use windows::{
    core::PCWSTR,
    Win32::{
        Foundation::ERROR_SUCCESS,
        System::Registry::{RegGetValueW, RRF_RT_REG_DWORD},
    },
};

pub fn to_windows_wide_string(string: &str) -> Vec<u16> {
    OsString::from(string)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

// A port of Superluminal's C++ dark theme check: https://gist.github.com/rovarma/7b85f3db80f40cc144866812cad09919
//
// The Windows 10 Anniversary Update (1803) introduced support for dark mode. This is mainly intended for UWP apps, but things like Explorer follow it as well.
// There is no API to query the value of this setting directly, but it is stored in the registry, so we can simply read it from there.
// Note that if the regkey is not found in the registry (i.e. in earlier versions of Windows), we default to light theme.
pub fn is_dark_theme_active() -> bool {
    let hkey = windows::Win32::System::Registry::HKEY_CURRENT_USER;
    let lpsubkey =
        to_windows_wide_string("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize");
    let lpvalue = to_windows_wide_string("AppsUseLightTheme");
    let mut pcbdata = std::mem::size_of::<u32>() as u32;
    let mut pvdata: u32 = Default::default();

    unsafe {
        // Read value of the registry key; if it's 0 it means dark theme is enabled.
        let res = RegGetValueW(
            hkey,
            PCWSTR(lpsubkey.as_ptr()),
            PCWSTR(lpvalue.as_ptr()),
            RRF_RT_REG_DWORD, // force RegGetValue to return a DWORD
            std::ptr::null_mut(),
            &mut pvdata as *mut u32 as *mut std::ffi::c_void,
            &mut pcbdata,
        );

        if res == ERROR_SUCCESS {
            return pvdata == 0;
        }
    }

    // Regkey not found, default to light theme.
    false
}
