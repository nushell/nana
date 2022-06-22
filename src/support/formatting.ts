import AnsiUp from 'ansi_up';
import hasAnsi from 'has-ansi';

// from: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
export function humanFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
    );

    return bytes.toFixed(dp) + ' ' + units[u];
}

/// Format a duration in nanoseconds into a string
export function humanDuration(dur: number) {
    let sign;
    let duration;
    if (dur >= 0) {
        sign = 1;
        duration = dur;
    } else {
        sign = -1;
        duration = -dur;
    }

    let micros = Math.floor(duration / 1000);
    let nanos = duration % 1000;

    let millis = Math.floor(micros / 1000);
    micros = micros % 1000;

    let secs = Math.floor(millis / 1000);
    millis = millis % 1000;

    let mins = Math.floor(secs / 60);
    secs = secs % 60;

    let hours = Math.floor(mins / 60);
    mins = mins % 60;

    let days = Math.floor(hours / 24);
    hours = hours % 24;

    let outputPrep = '';

    if (days != 0) {
        outputPrep += days + 'day';
    }

    if (hours != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += hours + 'hr';
    }

    if (mins != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += mins + 'min';
    }
    // output 0sec for zero duration
    if (duration == 0 || secs != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += secs + 'sec';
    }

    if (millis != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += millis + 'ms';
    }

    if (micros != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += micros + 'us';
    }

    if (nanos != 0) {
        if (outputPrep != '') {
            outputPrep += ' ';
        }
        outputPrep += nanos + 'ns';
    }

    return (sign == -1 ? '-' : '') + outputPrep;
}

export function ansiFormat(text_str: string) {
    if (hasAnsi(text_str)) {
        const ansi_up = new AnsiUp();

        let html = ansi_up.ansi_to_html(text_str);
        let linked_html = html.replace(
            /]8;;(.+)\\(.+)]8;;\\/,
            function (_match, p1, p2) {
                return '<a target="_blank" href="' + p1 + '">' + p2 + '</a>';
            }
        );
        return linked_html;
    } else {
        return text_str;
    }
}

export function UInt8ArrayToString(arr: Uint8Array) {
    const chunkSize = 0x8000;
    const c = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        c.push(
            String.fromCharCode.apply(
                null,
                Array.from(arr.subarray(i, i + chunkSize))
            )
        );
    }
    return c.join('');
}
