
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    var r$1=function(){return (r$1=Object.assign||function(t){for(var n,r=1,e=arguments.length;r<e;r++)for(var o in n=arguments[r])Object.prototype.hasOwnProperty.call(n,o)&&(t[o]=n[o]);return t}).apply(this,arguments)};function o$1(t,n,r,e){return new(r||(r=Promise))((function(o,a){function c(t){try{i(e.next(t));}catch(t){a(t);}}function l(t){try{i(e.throw(t));}catch(t){a(t);}}function i(t){var n;t.done?o(t.value):(n=t.value,n instanceof r?n:new r((function(t){t(n);}))).then(c,l);}i((e=e.apply(t,n||[])).next());}))}function a(t,n){var r,e,o,a,c={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return a={next:l(0),throw:l(1),return:l(2)},"function"==typeof Symbol&&(a[Symbol.iterator]=function(){return this}),a;function l(a){return function(l){return function(a){if(r)throw new TypeError("Generator is already executing.");for(;c;)try{if(r=1,e&&(o=2&a[0]?e.return:a[0]?e.throw||((o=e.return)&&o.call(e),0):e.next)&&!(o=o.call(e,a[1])).done)return o;switch(e=0,o&&(a=[2&a[0],o.value]),a[0]){case 0:case 1:o=a;break;case 4:return c.label++,{value:a[1],done:!1};case 5:c.label++,e=a[1],a=[0];continue;case 7:a=c.ops.pop(),c.trys.pop();continue;default:if(!(o=c.trys,(o=o.length>0&&o[o.length-1])||6!==a[0]&&2!==a[0])){c=0;continue}if(3===a[0]&&(!o||a[1]>o[0]&&a[1]<o[3])){c.label=a[1];break}if(6===a[0]&&c.label<o[1]){c.label=o[1],o=a;break}if(o&&c.label<o[2]){c.label=o[2],c.ops.push(a);break}o[2]&&c.ops.pop(),c.trys.pop();continue}a=n.call(t,c);}catch(t){a=[6,t],e=0;}finally{r=o=0;}if(5&a[0])throw a[1];return {value:a[0]?a[1]:void 0,done:!0}}([a,l])}}}

    function o(e,t){void 0===t&&(t=!1);var n=window.crypto.getRandomValues(new Uint32Array(1))[0],o="_".concat(n);return Object.defineProperty(window,o,{value:function(n){return t&&Reflect.deleteProperty(window,o),null==e?void 0:e(n)},writable:!1,configurable:!0}),n}function r(r,i){return void 0===i&&(i={}),o$1(this,void 0,void 0,(function(){return a(this,(function(e){return [2,new Promise((function(e,t){var c=o((function(t){e(t),Reflect.deleteProperty(window,a);}),!0),a=o((function(e){t(e),Reflect.deleteProperty(window,c);}),!0);window.__TAURI_IPC__(r$1({cmd:r,callback:c,error:a},i));}))]}))}))}function i(e,t){return void 0===t&&(t="asset"),navigator.userAgent.includes("Windows")?"https://".concat(t,".localhost/").concat(e):"".concat(t,"://").concat(e)}Object.freeze({__proto__:null,transformCallback:o,invoke:r,convertFileSrc:i});

    /* src/App.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].id;
    	child_ctx[8] = list[i].input;
    	child_ctx[9] = list[i].output;
    	return child_ctx;
    }

    // (199:1) {#each cards as { id, input, output }}
    function create_each_block(ctx) {
    	let div1;
    	let input;
    	let input_name_value;
    	let input_value_value;
    	let br;
    	let t0;
    	let div0;
    	let raw_value = /*output*/ ctx[9] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			br = element("br");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			attr_dev(input, "class", "input svelte-qt245k");
    			attr_dev(input, "name", input_name_value = "input" + /*id*/ ctx[7]);
    			input.value = input_value_value = /*input*/ ctx[8];
    			add_location(input, file, 200, 3, 4879);
    			add_location(br, file, 206, 5, 4988);
    			attr_dev(div0, "class", "output svelte-qt245k");
    			add_location(div0, file, 207, 3, 4998);
    			attr_dev(div1, "class", "card svelte-qt245k");
    			add_location(div1, file, 199, 2, 4857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, br);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			div0.innerHTML = raw_value;
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(init.call(null, input)),
    					listen_dev(input, "change", /*runCommand*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cards*/ 2 && input_name_value !== (input_name_value = "input" + /*id*/ ctx[7])) {
    				attr_dev(input, "name", input_name_value);
    			}

    			if (dirty & /*cards*/ 2 && input_value_value !== (input_value_value = /*input*/ ctx[8]) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*cards*/ 2 && raw_value !== (raw_value = /*output*/ ctx[9] + "")) div0.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(199:1) {#each cards as { id, input, output }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let p;
    	let i;
    	let t5;
    	let h1;
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;
    	let each_value = /*cards*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			button0 = element("button");
    			button0.textContent = "add new";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "remove";
    			t3 = space();
    			p = element("p");
    			i = element("i");
    			i.textContent = "Keybindings: shift+enter adds a new card";
    			t5 = space();
    			h1 = element("h1");
    			t6 = text(/*name*/ ctx[0]);
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(button0, file, 194, 1, 4644);
    			add_location(button1, file, 195, 1, 4694);
    			add_location(i, file, 196, 4, 4746);
    			add_location(p, file, 196, 1, 4743);
    			attr_dev(h1, "class", "svelte-qt245k");
    			add_location(h1, file, 197, 1, 4799);
    			attr_dev(main, "class", "svelte-qt245k");
    			add_location(main, file, 193, 0, 4611);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(main, t1);
    			append_dev(main, button1);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(p, i);
    			append_dev(main, t5);
    			append_dev(main, h1);
    			append_dev(h1, t6);
    			append_dev(main, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*addNewIOcard*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*removeIOcard*/ ctx[4], false, false, false),
    					listen_dev(main, "keydown", /*maybeAddNew*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t6, /*name*/ ctx[0]);

    			if (dirty & /*cards, runCommand*/ 6) {
    				each_value = /*cards*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

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

    		if (arr[0] == 0x89 && arr[1] == 0x50 && arr[2] == 0x4e && arr[3] == 0x47) {
    			// PNG
    			let u8 = new Uint8Array(arr);

    			let myOut = btoa(String.fromCharCode.apply(null, u8));
    			output_html += '<img src="data:image/png;base64,' + myOut + '">';
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
    					output_html += "</tr><tr><th>" + (idx / 16 * 16).toString(16) + "</th>";
    				}

    				output_html += "<td>" + arr[idx].toString(16) + "</td>";
    			}

    			output_html += "</tr></table>";
    		}
    	} else if (json_obj.Nothing) ; else if (json_obj.Record) {
    		let fields = get_fields(json_obj);
    		output_html += '<table class="styled-table">';

    		for (const field in fields) {
    			output_html += "<tr>";
    			output_html += "<th>" + fields[field] + "</th>";
    			output_html += "<td align=left>" + convert_json_obj_to_html(json_obj.Record.vals[field]) + "</td>";
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
    						output_html += "<td align=left>" + convert_json_obj_to_html(arr[value].Record.vals[field]) + "</td>";
    					}

    					output_html += "</tr>";
    				}
    			} else {
    				output_html += "<tr></tr>";

    				for (const value in arr) {
    					output_html += "<tr>" + "<th>" + value + "</th>" + "<td>" + convert_json_obj_to_html(arr[value]) + "</td></tr>";
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

    function init(el) {
    	el.focus();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let card_id = 1;
    	let cards = [{ id: 1, input: "", output: "" }];

    	function runCommand(input) {
    		console.log(input);
    		let src = input.target.name;

    		r("simple_command_with_result", { argument: input.target.value }).then(response => {
    			let html_response = convert_json_to_html(response);

    			for (const pos in cards) {
    				if ("input" + cards[pos].id === src) {
    					$$invalidate(1, cards[pos].input = input.target.value, cards);
    					$$invalidate(1, cards[pos].output = `${html_response}`, cards);
    				}
    			}

    			console.log(cards);
    		}).catch(error => {
    			for (const pos in cards) {
    				if ("input" + cards[pos].id === src) {
    					$$invalidate(1, cards[pos].input = input.target.value, cards);
    					$$invalidate(1, cards[pos].output = `<pre>${error}</pre>`, cards);
    				}
    			}

    			console.log(cards);
    		});
    	}

    	function addNewIOcard() {
    		card_id += 1;
    		cards.push({ id: card_id, input: "", output: "" });
    		$$invalidate(1, cards);
    	}

    	function removeIOcard() {
    		cards.pop();
    		$$invalidate(1, cards);
    	}

    	function maybeAddNew(event) {
    		if (event.keyCode == 13 && event.shiftKey) {
    			addNewIOcard();
    		}
    	}

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		invoke: r,
    		name,
    		card_id,
    		cards,
    		get_fields,
    		convert_json_obj_to_html,
    		convert_json_to_html,
    		runCommand,
    		addNewIOcard,
    		removeIOcard,
    		maybeAddNew,
    		init
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('card_id' in $$props) card_id = $$props.card_id;
    		if ('cards' in $$props) $$invalidate(1, cards = $$props.cards);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, cards, runCommand, addNewIOcard, removeIOcard, maybeAddNew];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'Nana',
            response_text: "",
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
