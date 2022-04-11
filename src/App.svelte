<script>
	import { invoke } from "@tauri-apps/api/tauri";

	export let name;

	export let response_text;

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
		} else if (json_obj.Filesize) {
			return json_obj.Filesize.val.toString();
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
		// }
		// }
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
		invoke("simple_command_with_result", { argument: input.target.value })
			.then((response) => {
				let html_response = convert_json_to_html(response);
				response_text = `${html_response}`;
			})
			.catch((error) => {
				response_text = `<pre>${error}</pre>`;
			});
	}
</script>

<main>
	<h1>{name}</h1>

	<!--
	<code-input
		style="resize: both; overflow: hidden; width: 90%;"
		lang="JavaScript"
		placeholder="Enter some JS!"
		value="// Edit this right here!
console.log('Hello, World!');
let name = prompt('What\'s your name?');
console.log('Hello, ' + name + '!');


// The `resize: both; overflow: hidden;`
// CSS has been applied to this, so...
// You can resize this too! "
	/>-->
	<input name="inputOne" on:change={runCommand} />
	<!-- <button on:click={runCommand}> click me </button> -->
	<div class="output">
		{@html response_text}
	</div>
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

	.output {
		display: flex;
		justify-content: center;
		text-align: left;
		padding: 1em;
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
