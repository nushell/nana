<script>
	import { invoke } from "@tauri-apps/api/tauri";

	export let name;

	let card_id = 1;

	let cards = [{ id: 1, input: "", output: "" }];

	function get_fields(record) {
		let fields = [];

		if (record.Record) {
			for (const field in record.Record.cols) {
				fields.push(record.Record.cols[field]);
			}
		}

		return fields;
	}

	function convert_json_obj_to_html(json_obj) {
		let output_html = "";

		if (!json_obj) {
			return "";
		} else if (json_obj.Int) {
			return json_obj.Int.val.toString();
		} else if (json_obj.String) {
			let string = json_obj.String.val;
			string = string.replace(/(?:\r\n|\r|\n)/g, "<br>");
			return string;
		} else if (json_obj.Float) {
			return json_obj.Float.val.toString();
		} else if (json_obj.Bool) {
			return json_obj.Bool.val.toString();
		} else if (json_obj.Filesize) {
			return json_obj.Filesize.val.toString();
		} else if (json_obj.Duration) {
			return json_obj.Duration.val.toString();
		} else if (json_obj.Date) {
			return json_obj.Date.val.toString();
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
				output_html += "<th></th>";
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
					convert_json_obj_to_html(json_obj.Record.vals[field]) +
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
								convert_json_obj_to_html(
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
							convert_json_obj_to_html(arr[value]) +
							"</td></tr>";
					}
				}
				output_html += "</table>";
			}
		}
		return output_html;
	}
	function convert_json_to_html(json_text) {
		let json_obj = JSON.parse(json_text);

		let output = convert_json_obj_to_html(json_obj);
		if (output == "") {
			return json_text;
		} else {
			return output;
		}
	}

	function runCommand(input) {
		console.log(input);
		let src = input.target.name;
		invoke("simple_command_with_result", { argument: input.target.value })
			.then((response) => {
				let html_response = convert_json_to_html(response);
				for (const pos in cards) {
					if ("input" + cards[pos].id === src) {
						cards[pos].input = input.target.value;
						cards[pos].output = `${html_response}`;
					}
				}

				addNewIOcard();
			})
			.catch((error) => {
				for (const pos in cards) {
					if ("input" + cards[pos].id === src) {
						cards[pos].input = input.target.value;
						cards[pos].output = `<pre>${error}</pre>`;
					}
				}
			});
	}

	function addNewIOcard() {
		card_id += 1;
		cards.push({ id: card_id, input: "", output: "" });
		cards = cards;
	}

	function removeIOcard() {
		cards.pop();
		cards = cards;
	}

	function maybeAddNew(event) {
		if (event.keyCode == 13 && event.shiftKey) {
			addNewIOcard();
		}
	}

	function init(el) {
		el.focus();
	}
</script>

<main on:keydown={maybeAddNew}>
	<button on:click={addNewIOcard}>add new</button>
	<button on:click={removeIOcard}>remove</button>
	<p><i>Keybindings: shift+enter adds a new card</i></p>
	<h1>{name}</h1>
	{#each cards as { id, input, output }}
		<div class="card">
			<input
				class="input"
				name="input{id}"
				value={input}
				use:init
				on:change={runCommand}
			/><br />
			<div class="output">
				{@html output}
			</div>
		</div>
	{/each}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.input {
		justify-content: center;
		min-width: 400px;
	}

	.output {
		display: flex;
		justify-content: center;
		text-align: left;
		padding: 1em;
		background-color: white;
	}

	.card {
		background-color: aliceblue;
		padding: 1em;
		margin: 25px 0;
	}

	:global(.styled-table) {
		border-collapse: collapse;
		margin: 25px 0;
		font-size: 0.9em;
		font-family: sans-serif;
		/* min-width: 300px; */
		max-width: 100%;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
	}

	:global(.styled-table thead tr) {
		background-color: #009879;
		color: #ffffff;
		text-align: left;
	}
	:global(.styled-table th),
	:global(.styled-table td) {
		padding: 12px 15px;
	}

	:global(.styled-table tbody tr) {
		border-bottom: 1px solid #dddddd;
	}

	:global(.styled-table tbody tr:nth-of-type(even)) {
		background-color: #f3f3f3;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
