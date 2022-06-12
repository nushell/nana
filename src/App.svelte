<script lang="ts">
    import { invoke } from "@tauri-apps/api/tauri";
    import { default as AnsiUp } from "ansi_up";
    import hasAnsi from "has-ansi";
    import Tailwindcss from "./Tailwindcss.svelte";

    let cardId = 1;

    // History related values
    let historyPos = 0;
    let historyContent = "";

    type Card = {
        id: number;
        cwd: string;
        input: string;
        output: string;
    };

    let cards: Array<Card> = [];
    createCard().then((card) => {
        cards.push(card);
        cards = cards; // seems like this is necessary to trigger a re-render. TODO: find out why
    });

    function get_fields(record: any) {
        let fields = [];

        if (record.Record) {
            for (const field in record.Record.cols) {
                fields.push(record.Record.cols[field]);
            }
        }

        return fields;
    }

    /// Format a duration in nanoseconds into a string
    function humanDuration(dur: number) {
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

        let outputPrep = "";

        if (days != 0) {
            outputPrep += days + "day";
        }

        if (hours != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += hours + "hr";
        }

        if (mins != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += mins + "min";
        }
        // output 0sec for zero duration
        if (duration == 0 || secs != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += secs + "sec";
        }

        if (millis != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += millis + "ms";
        }

        if (micros != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += micros + "us";
        }

        if (nanos != 0) {
            if (outputPrep != "") {
                outputPrep += " ";
            }
            outputPrep += nanos + "ns";
        }

        return (sign == -1 ? "-" : "") + outputPrep;
    }

    // from: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
    function humanFileSize(bytes: number, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + " B";
        }

        const units = si
            ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
            : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (
            Math.round(Math.abs(bytes) * r) / r >= thresh &&
            u < units.length - 1
        );

        return bytes.toFixed(dp) + " " + units[u];
    }

    /**
     * The helper that works with objects inside of other objects, converting them to their
     * html form
     * @param json_obj the object to convert
     */
    function convert_json_obj_to_html_inner(json_obj: any) {
        let output_html = "";

        if (!json_obj) {
            return "";
        } else if (json_obj.Int) {
            return json_obj.Int.val.toString();
        } else if (json_obj.String) {
            let string = json_obj.String.val;
            string = string.replace(/</g, "&lt;");
            string = string.replace(/>/g, "&gt;");
            string = string.replace(/(?:\r\n|\r|\n)/g, "<br>");
            return string;
        } else if (json_obj.Float) {
            return json_obj.Float.val.toString();
        } else if (json_obj.Bool) {
            return json_obj.Bool.val.toString();
        } else if (json_obj.Filesize) {
            return humanFileSize(json_obj.Filesize.val);
        } else if (json_obj.Duration) {
            return humanDuration(json_obj.Duration.val);
        } else if (json_obj.Date) {
            let myDate = new Date(Date.parse(json_obj.Date.val));
            return myDate.toLocaleString();
        } else if (json_obj.Binary) {
            let arr = json_obj.Binary.val;
            if (
                arr[0] == 0x89 &&
                arr[1] == 0x50 &&
                arr[2] == 0x4e &&
                arr[3] == 0x47
            ) {
                // PNG
                let u8 = new Uint8Array(arr);
                let myOut = btoa(String.fromCharCode.apply(null, u8));
                output_html +=
                    '<img src="data:image/png;base64,' + myOut + '">';
            } else {
                output_html += '<table class="styled-table"><tr>';

                let arrLen = arr.length;
                output_html += "<th><strong>hex</strong></th>";
                for (let idx = 0; idx < 16; ++idx) {
                    output_html += "<th>" + idx.toString(16) + "</th>";
                }
                output_html += "</tr><tr><th>0</td>";

                for (let idx = 0; idx < arrLen; ++idx) {
                    if (idx > 0 && idx % 16 == 0) {
                        output_html +=
                            "</tr><tr><th>" +
                            ((idx / 16) * 16).toString(16) +
                            "</th>";
                    }
                    output_html += "<td>" + arr[idx].toString(16) + "</td>";
                }
                output_html += "</tr></table>";
            }
        } else if (json_obj.Nothing) {
            output_html += "<b></b>";
        } else if (json_obj.Record) {
            let fields = get_fields(json_obj);

            output_html += '<table class="styled-table">';
            for (const field in fields) {
                output_html += "<tr>";
                output_html += "<th>" + fields[field] + "</th>";
                output_html +=
                    "<td align=left>" +
                    convert_json_obj_to_html_inner(
                        json_obj.Record.vals[field]
                    ) +
                    "</td>";
                output_html += "</tr>";
            }
            output_html += "</table>";
        } else if (json_obj.List) {
            let arr = json_obj.List.vals;

            if (arr.length > 0) {
                let fields = get_fields(arr[0]);

                output_html += '<table class="styled-table">';
                if (fields.length > 0) {
                    output_html += "<tr>";
                    for (const field in fields) {
                        output_html += "<th>" + fields[field] + "</th>";
                    }
                    output_html += "</tr>";
                    for (const value in arr) {
                        output_html += "<tr>";
                        for (const field in fields) {
                            output_html +=
                                "<td align=left>" +
                                convert_json_obj_to_html_inner(
                                    arr[value].Record.vals[field]
                                ) +
                                "</td>";
                        }
                        output_html += "</tr>";
                    }
                } else {
                    output_html += "<tr></tr>";
                    for (const value in arr) {
                        output_html +=
                            "<tr>" +
                            "<th>" +
                            value +
                            "</th>" +
                            "<td>" +
                            convert_json_obj_to_html_inner(arr[value]) +
                            "</td></tr>";
                    }
                }
                output_html += "</table>";
            }
        } else {
            output_html = "$$$unknown$$$";
        }
        return output_html;
    }

    function convertJsonObjToHtml(jsonObj: any) {
        let outputHtml = "";

        if (!jsonObj) {
            return "";
        } else if (jsonObj.String) {
            let string = jsonObj.String.val;

            string = string.replace(/</g, "&lt;");
            string = string.replace(/>/g, "&gt;");
            // string = "<pre>" + string + "</pre>";
            string = string.replace(/(?:\r\n|\r|\n)/g, "<br>");
            // return "<textarea>" + string + "</textarea>";
            return string;
        } else if (
            jsonObj.Int ||
            jsonObj.Float ||
            jsonObj.Bool ||
            jsonObj.Filesize ||
            jsonObj.Duration ||
            jsonObj.Date ||
            jsonObj.Binary ||
            jsonObj.Nothing ||
            jsonObj.Record ||
            jsonObj.List
        ) {
            return convert_json_obj_to_html_inner(jsonObj);
        } else {
            outputHtml = "$$$unknown$$$";
        }
        return outputHtml;
    }

    function convertJsonToHtml(json_text: string) {
        let json_obj = JSON.parse(json_text);

        let output = convertJsonObjToHtml(json_obj);
        let ansi = ansi_to_html(output);
        if (ansi == "$$$unknown$$$") {
            return json_text;
        } else {
            return ansi;
        }
    }

    function updateCard(cardName: string, input: string, output: string) {
        for (const pos in cards) {
            if ("input" + cards[pos].id === cardName) {
                cards[pos].input = input;
                cards[pos].output = output;
            }
        }
    }

    async function addNewIOcard() {
        let last = "nothing";
        cards.lastIndexOf;
        for (const card in cards) {
            last = cards[card].output;
        }

        if (last != "") {
            cardId += 1;

            let card = await createCard();
            cards.push(card);
            cards = cards;
            historyPos = cards.length - 1;
        }
    }

    async function createCard(): Promise<Card> {
        cardId += 1;
        let cwd = await invoke("get_working_directory");
        return {
            id: cardId,
            cwd: cwd as string,
            input: "",
            output: "",
        };
    }

    function closeCard(id: number) {
        console.log(id);
        for (const pos in cards) {
            if (cards[pos].id === id) {
                cards.splice(parseInt(pos), 1);
                cards = cards;
                console.log(cards);
                return;
            }
        }
    }

    function init(el: HTMLElement) {
        el.focus();
    }

    function ansi_to_html(text_str: string) {
        if (hasAnsi(text_str)) {
            var ansi_up = new AnsiUp();

            let html = ansi_up.ansi_to_html(text_str);
            let linked_html = html.replace(
                /]8;;(.+)\\(.+)]8;;\\/,
                function (match, p1, p2) {
                    return '<a href="' + p1 + '">' + p2 + "</a>";
                }
            );
            return linked_html;
        } else {
            return text_str;
        }
    }

    async function navigateInput(ev: any) {
        if (ev.key == "ArrowUp") {
            if (historyPos - 1 >= 0) {
                if (cards[historyPos].id == cardId) {
                    // Save what we were just typing so we can come back to it
                    historyContent = ev.target.value;
                }
                historyPos -= 1;

                let historyInput = cards[historyPos].input;

                updateCard("input" + cardId, historyInput, "");
            }
        } else if (ev.key == "ArrowDown") {
            if (historyPos + 1 < cards.length) {
                historyPos += 1;

                if (cards[historyPos].id == cardId) {
                    // Use our cached input that the user already gave us

                    updateCard("input" + cardId, historyContent, "");
                } else {
                    let historyInput = cards[historyPos].input;

                    updateCard("input" + cardId, historyInput, "");
                }
            }
        } else if (ev.key == "Enter") {
            let src = ev.target.name;
            try {
                let response: string = await invoke(
                    "simple_command_with_result",
                    {
                        argument: ev.target.value,
                    }
                );
                let html_response = convertJsonToHtml(response);
                updateCard(src, ev.target.value, `${html_response}`);

                await addNewIOcard();
            } catch (error) {
                for (const pos in cards) {
                    if ("input" + cards[pos].id === src) {
                        cards[pos].input = ev.target.value;
                        let ansi = ansi_to_html(error);

                        cards[pos].output = `<pre>${ansi}</pre>`;
                    }
                }
            }
        } else if (ev.key == "Tab") {
            ev.preventDefault();
            let src = ev.target.name;
            console.log(ev);
            try {
                let completions: Array<{ completion: String; start: number }> =
                    await invoke("complete", {
                        argument: ev.target.value,
                        position: ev.target.selectionEnd,
                    });

                console.log(
                    "completing: " +
                        ev.target.value +
                        " at " +
                        ev.target.selectionEnd
                );
                console.log("completions: ");
                console.log(completions);
                if (completions.length > 0) {
                    let before = ev.target.value.slice(0, completions[0].start);
                    let comp = completions[0].completion;
                    let after = ev.target.value.slice(
                        completions[0].start +
                            ev.target.selectionStart -
                            completions[0].start
                    );

                    let newInput = before + comp + after;
                    updateCard("input" + cardId, newInput, "");
                }
            } catch (error) {}
        }
    }

    function setFocusByName(name: String) {
        for (const pos in cards) {
            if ("input" + cards[pos].id === name) {
                cardId = cards[pos].id;
                historyPos = parseInt(pos);
            }
        }
    }

    function setFocus(ev: any) {
        console.log(ev);

        setFocusByName(ev.target.name);
    }
</script>

<Tailwindcss />

<main>
    {#each cards as { id, cwd, input, output }}
        <div class="mb-2   flex flex-col " on:keydown={navigateInput}>
            <div
                class="mr-4 w-fit translate-y-1 self-end rounded-t bg-solarized-blue px-2 font-mono text-sm text-solarized-base2 dark:bg-solarized-base01"
            >
                <span class="">{cwd}</span>
                <span>
                    <i
                        class="fa-solid fa-xmark inline cursor-pointer text-sm text-solarized-base3 hover:text-solarized-red dark:text-solarized-base03"
                        on:click={() => closeCard(id)}
                    />
                </span>
            </div>

            <div
                id="card-body"
                class="rounded bg-solarized-blue px-2 pb-2 pt-2 dark:bg-solarized-base01"
            >
                <div id="header" class="flex">
                    <input
                        autocapitalize="none"
                        class="input  w-full rounded-sm bg-solarized-base3 pl-2
                        font-mono text-solarized-base03 outline-none focus:ring-2 focus:ring-solarized-base0 dark:border-solarized-base02 
                        dark:bg-solarized-base03 dark:text-solarized-base3 dark:focus:ring-solarized-blue"
                        name="input{id}"
                        value={input}
                        use:init
                        on:focus={setFocus}
                    />
                </div>

                {#if output != ""}
                    <div
                        class="mt-2 rounded-sm  border-solarized-base1 text-left font-mono text-sm text-solarized-base3 dark:border-solarized-base0 dark:bg-solarized-base02"
                    >
                        {@html output}
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</main>
