var maindiv = null;
var socket = null;
var mousetime = 0;
var sid;
var dragged = null;
var hold = null;
var active = 'maindiv'; // последний кликнутый элемент
var element = null;



function divMap(mode = true) {
	divs = elementList = document.querySelectorAll('[hwndform]');
	divs.forEach(function (div) {
		if (mode == true) {
			div.classList.add('divmap');
		} else {
			div.classList.remove('divmap');
		}

	})
}

function b64_to_utf8(str) {
	if (str.length == 0) return "";
	return decodeURIComponent(atob(str).split('').map(function (c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));
}

function utf8_to_b64(str) {
	if (str.length == 0) return "";
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
		function toSolidBytes(match, p1) {
			return String.fromCharCode('0x' + p1);
		}));
}

function getElementsByXPath(xpath, parent) {
	let results = [];
	let query = document.evaluate(xpath,
		parent || document,
		null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (let i = 0, length = query.snapshotLength; i < length; ++i) {
		results.push(query.snapshotItem(i));
	}
	return results;
}

function GetOrCreateForm(hwndform) {
	var id = "div_" + hwndform.toString();
	var thisdiv = document.getElementById(id);
	if (thisdiv) return thisdiv;
	thisdiv = document.createElement("div");
	thisdiv.id = id;
	thisdiv.setAttribute("style", "display:block;width:500px;height:500px");
	thisdiv.style.position = "absolute";
	thisdiv.setAttribute("hwndform", hwndform.toString());
	document.body.append(thisdiv);
	return thisdiv;
}

function GetOrCreateControl(hwndform, hwndctrl) {
	var id = "div_" + hwndform.toString() + "_" + hwndctrl.toString();
	var thisdiv = document.getElementById(id);
	if (thisdiv) return thisdiv;
	thisdiv = document.createElement("div");
	thisdiv.id = id;
	thisdiv.setAttribute("style", "display:block;width:500px;height:500px");
	thisdiv.style.position = "absolute";
	thisdiv.setAttribute("hwndform", hwndform.toString());
	thisdiv.setAttribute("hwndctrl", hwndctrl.toString());
	//		thisdiv.setAttribute("onmousedown", "OnMouseDown(event)");
	//		thisdiv.setAttribute("onmouseup", "OnMouseUp(event)");
	document.body.append(thisdiv);
	return thisdiv;
}

function HideEditCtrl(issend) {
	var id = "editctrl";
	var editctrl = document.getElementById(id);
	if (!editctrl) return false;
	if (issend) {
		var obj = {
			command: "ActionSetText",
			data: {
				hwndform: editctrl.getAttribute("hwndform"),
				hwndctrl: editctrl.getAttribute("hwndctrl"),
				typectrl: editctrl.getAttribute("typectrl"),
				newvalue: utf8_to_b64(editctrl.value)
			}
		}
		sendMsg(obj);
	}
	editctrl.remove();
	active = 'maindiv';
	return true;
}

function ShowEditCtrl(divel) {
	var id = "editctrl";
	var editctrl = document.getElementById(id);
	if (editctrl) {
		HideEditCtrl(false);
	}
	editctrl = document.createElement("input");
	editctrl.id = id;
	editctrl.setAttribute("style", "display:block;width:500px;height:500px");
	editctrl.style.position = "absolute";
	editctrl.setAttribute("hwndform", divel.getAttribute("hwndform"));
	editctrl.setAttribute("hwndctrl", divel.getAttribute("hwndctrl"));
	editctrl.setAttribute("typectrl", divel.getAttribute("typectrl"));
	editctrl.style.left = divel.style.left;
	editctrl.style.top = divel.style.top;
	editctrl.style.width = divel.style.width;
	editctrl.style.height = divel.style.height;
	editctrl.style.zIndex = divel.style.zIndex + 10;
	//editctrl.setAttribute("onkeyup", "OnKeyUp(event)");
	editctrl.value = b64_to_utf8(divel.getAttribute("currentvalue"));
	document.body.append(editctrl);
	editctrl.focus();
	editctrl.select();
	active = id;
}

function SendGetForms() {
	var obj = new Object();
	obj.command = "GetForms";
	sendMsg(obj);
}

function OnMainKeyDn(ev) {
	ev.altKey == true && ev.key == 'Alt' ? divMap() : null;
	if (ev.target.getAttribute("id") == "editctrl") {
		if (ev.code == "Enter" || ev.code == "Tab" || ev.code == "ArrowUp" || ev.code == "ArrowDown") {
			HideEditCtrl(true);
			return;
		}
	}
}

function OnMainKeyUp(ev) {
	if (ev.target.getAttribute("id") == "editctrl") return;
	if (ev.altKey == true || ev.key == 'Alt') {
		divMap(false);
		return;
	}

	if (ev.code == "Enter" || ev.code == "Tab" || ev.code == "ArrowUp" || ev.code == "ArrowDown") {
		return;
	}

	if (ev.code == "F4") {
		var obj = {
			command: "ActionKeyPress",
			data: getTelemetry(ev)
		}
		data.key = 'F5';
		sendMsg(obj);
	} else {
		msg = {
			'command': 'keyup',
			'code': ev.keyCode,
			'key': ev.key,
			'data': getTelemetry(ev),
			'ctrls': {
				'shiftKey': ev.shiftKey,
				'ctrlKey': ev.ctrlKey,
			}
		};
		delete msg.data.ctrls
		sendMsg(msg);
	}
}



function OnMouseClick(ev) {
	let div = document.getElementById(ev.target.id);
	let elapsedTime = Date.now() - mousetime;
	let typectrl = div.getAttribute("typectrl") * 1;
	let isfocus = div.getAttribute("isfocus") * 1;
	active = ev.target.id;
	if (HideEditCtrl(false)) {
		mousetime = 0;
		return;
	}

	if (typectrl !== undefined && typectrl == 3) {
		ShowEditCtrl(div);
		return;
	}

	var obj = {
		command: 'ActionClick',
		data: getTelemetry(ev, div)
	};
	if (hold == true) {
		obj.command = 'ActionClickMenu';
		hold = null;
		ev.preventDefault();
		sendMsg(obj);
		return false;
	} else {
		sendMsg(obj);
		mousetime = 0;
	}
}

function OnContextMenu(ev) {
	hold = true;
	let el = document.getElementById(ev.target.id);
	if (el.getAttribute('typectrl') == '7') {
		element = el;
		document.getElementById('uploader').click();
		hold = false;
	}
	ev.preventDefault();
	return false;
}

function OnDblClick(ev) {
	var obj = {
		'command': 'ActionDblClick',
		'data': getTelemetry(ev)
	}
	sendMsg(obj);
	mousetime = 0;
}

function Processed_RemoveForm(json) {
	var hwndform = json.hwndform;
	var id = "div_" + hwndform.toString();
	var thisdiv = document.getElementById(id);
	if (thisdiv) {
		thisdiv.remove();
	}
	let items = getElementsByXPath(".//div[contains(@id,'" + id + "')]");
	items.forEach(element => element.remove());
}

function Processed_UpdateForm(json) {
	var f = json.forms[0];

	var formX = 0;
	var formY = 0;
	var formzIndex = 1;

	if (f.ismain == 1) {
		maindiv = document.getElementById("maindiv");
		maindiv.id = "div" + f.hwndform;
		maindiv.style.width = f.width;
		maindiv.style.height = f.height;
		maindiv.style.position = "absolute";
		maindiv.style.left = '0px';
		maindiv.style.top = '0px';
		maindiv.style.backgroundImage = "url('data:image/png;base64," + f.bmp + "')";
		maindiv.setAttribute("hwndform", f.hwndform.toString());
		//maindiv.setAttribute("onmousedown", "OnMouseDown(event)");
		//maindiv.setAttribute("onmouseup", "OnMouseUp(event)");
		maindiv.style.zIndex = "1";
		maindiv.setAttribute('data-zindex', 1);
		maindivloaded = true;
		formzIndex = 10;
	} else {
		var subform = GetOrCreateForm(f.hwndform);
		formX = f.left;
		formY = f.top;
		subform.style.left = formX + 'px';
		subform.style.top = formY + 'px';
		subform.style.width = f.width;
		subform.style.height = f.height;
		subform.style.backgroundImage = "url('data:image/png;base64," + f.bmp + "')";
		if (f.isfocus == 1) {
			subform.style.zIndex = "10000";
			formzIndex = 10010;
		} else {
			subform.style.zIndex = "100";
			formzIndex = 110;
		}
		subform.setAttribute('data-zindex', subform.style.zIndex);
	}

	for (var k in f.controls) {
		var ctrl = f.controls[k];
		var htmlctrl = GetOrCreateControl(f.hwndform, ctrl.hwndctrl);
		var x = formX + ctrl.left;
		var y = formY + ctrl.top;
		htmlctrl.style.left = x + 'px';
		htmlctrl.style.top = y + 'px';
		htmlctrl.style.width = ctrl.width;
		htmlctrl.style.height = ctrl.height;
		htmlctrl.style.zIndex = formzIndex.toString();
		htmlctrl.setAttribute("isfocus", ctrl.isfocus.toString());
		htmlctrl.setAttribute("typectrl", ctrl.typectrl.toString());
		htmlctrl.setAttribute("currentvalue", ctrl.currentvalue.toString());
		htmlctrl.setAttribute('data-zindex', htmlctrl.style.zIndex);
		formzIndex++;
	}
}

function Processed_RemovePopupMenu(json) {
	var id = "div_popupmenu";
	var thisdiv = document.getElementById(id);
	if (thisdiv) {
		thisdiv.remove();
	}
}

function Processed_UpdatePopupMenu(json) {
	var f = json.forms[0];

	var formX = 0;
	var formY = 0;
	var formzIndex = 1;

	var id = "div_popupmenu";
	var thisdiv = document.getElementById(id);
	if (!thisdiv) {
		thisdiv = document.createElement("div");
		thisdiv.id = id;
		thisdiv.setAttribute("style", "display:block;width:500px;height:500px");
		thisdiv.style.position = "absolute";
		thisdiv.setAttribute("hwndform", f.hwndform.toString());
		thisdiv.setAttribute("hmenu", f.hmenu.toString());
		//			thisdiv.setAttribute("onmousedown", "OnMouseDown(event)");
		//			thisdiv.setAttribute("onmouseup", "OnContextMenu(event)");
		document.body.append(thisdiv);
	}

	formX = f.left;
	formY = f.top;
	thisdiv.style.left = formX + 'px';
	thisdiv.style.top = formY + 'px';
	thisdiv.style.width = f.width;
	thisdiv.style.height = f.height;
	thisdiv.style.backgroundImage = "url('data:image/png;base64," + f.bmp + "')";
	if (f.isfocus == 1) {
		thisdiv.style.zIndex = "20000";
		formzIndex = 20010;
	}

}

function ReceivedMessage(strjson) {
	var json;
	json = JSON.parse(strjson);
	var command = json.command;
	if (command == "UpdateForm") {
		Processed_UpdateForm(json);
	} else if (command == "RemoveForm") {
		Processed_RemoveForm(json);
	} else if (command == "UpdatePopupMenu") {
		Processed_UpdatePopupMenu(json);
	} else if (command == "RemovePopupMenu") {
		Processed_RemovePopupMenu(json);
	} else if (command == "start") {
		setSession(json.sid);
	}
}

function getSession() {
	let msg = {
		'command': 'session'
	};
	sid = localStorage.getItem('sid');
	if (sid == undefined) {
		msg.sid = null;
	} else {
		msg.sid = sid;
	}
	socket.send(JSON.stringify(msg));
}

function setSession(session_id) {
	sid = session_id
	localStorage.setItem('sid', sid);
}

function getTelemetry(ev, div = null) {
	if (div == null) {
		let id = active;
		if (ev.target.id !== undefined && ev.target.id > '') {
			id = ev.target.id;
		}
		div = document.getElementById(id);
	}

	if (!div) return {};

	var scrollleft = document.documentElement.scrollLeft;
	var scrolltop = document.documentElement.scrollTop;
	if (scrollleft == 0) scrollleft = document.body.scrollLeft;
	if (scrolltop == 0) scrolltop = document.body.scrollTop;

	var data = {
		hwndform: null,
		hwndctrl: null,
		x: null,
		y: null,
		button: 0,
		ctrls: {
			'shiftKey': ev.shiftKey,
			'ctrlKey': ev.ctrlKey,
			//'altKey': ev.altKey
		}
	};

	if (div.getAttribute("hwndform") !== undefined) data.hwndform = div.getAttribute("hwndform");
	if (div.getAttribute("hwndctrl") !== undefined) data.hwndctrl = div.getAttribute("hwndctrl");

	if (ev.clientX !== undefined) {
		data.x = Math.ceil(ev.clientX - div.offsetLeft + scrollleft);
	}
	if (ev.clientY !== undefined) {
		data.y = Math.ceil(ev.clientY - div.offsetTop + scrolltop);
	}

	if (ev.which == 1) {
		data.mouse = "left";
	} else if (ev.which == 2) {
		data.mouse = "whell";
	} else if (ev.which == 3) {
		data.mouse = "right";
		data.button = 1;
	}
	return data;
}

function sendMsg(obj) {
	console.log(obj);
	msg = JSON.stringify(obj);
	let res = false;
	if (socket && socket.readyState == socket.OPEN) {
		res = socket.send(msg);
	}
	return res;
}

function doUnload() {
	console.log('Goodby!');
	let msg = {
		'sid': localStorage.getItem('sid'),
		'command': 'unload'
	};
	socket.send(JSON.stringify(msg));
	setTimeout(function () {
		socket.onclose = function () { }; // disable onclose handler first
		socket.close();
	}, 1000)
}


function doLoad() {
	window.WebSocket = window.WebSocket || window.WebKitWebSocket || window.MozWebSocket;
	socket = localStorage.getItem('socket');
	if (socket == undefined || socket.readyState !== 'OPEN') {
		socket = new WebSocket("ws://185.43.6.37:80");
		localStorage.setItem('socket', socket);
	}
	socket.binaryType = "arraybuffer";
	socket.onopen = function (event) {
		console.log(event);
		setTimeout(function () {
			getSession();
			SendGetForms();
		}, 100);
	};
	socket.onmessage = function (event) {
		if (event.data) {
			ReceivedMessage(event.data);
		}
	};
	socket.onerror = function (event) {
		console.log(event);
	};

	socket.onclose = function (event) {
		console.log(event);
		socket = null;
	};

	startInteract();
	window.addEventListener('keydown', OnMainKeyDn);
	window.addEventListener('keyup', OnMainKeyUp);
	//window.addEventListener('contextmenu', OnContextMenu);
	//window.addEventListener('dblclick', OnDblClick);
}

function startInteract(div = null) {
	if (div == null) div = "div";
	let startX, startY;
	interact(div, {
		styleCursor: false
	})
		.draggable({
			listeners: {
				start(ev) {
					let dragged = document.getElementById(ev.target.id);
					if (dragged.getAttribute('typectrl') !== '2') {
						let msg = {
							'command': 'DragStart',
							'data': getTelemetry(ev, dragged)
						}
						msg.data.x = Math.ceil(ev.clientX);
						msg.data.y = Math.ceil(ev.clientY);
						sendMsg(msg);
					} else {
						startX = ev.clientX;
						startY = ev.clientY;
					}
				},
				end(ev) {
					let dragged = document.getElementById(ev.target.id);
					if (dragged.getAttribute('typectrl') !== '2') {
						let msg = {
							'command': 'DragStop',
							'data': getTelemetry(ev, dragged)
						}
						msg.data.x = Math.ceil(ev.clientX);
						msg.data.y = Math.ceil(ev.clientY);
						sendMsg(msg);
					} else {
						var form = dragged.getAttribute('hwndform');
						var main = document.getElementById("div_" + form);
						let msg = {
							'command': 'ActionFormMove',
							'data': getTelemetry(ev, main)
						}
						msg.data.x = main.style.left.substr(0, main.style.left.length - 2) * 1;
						msg.data.y = main.style.top.substr(0, main.style.top.length - 2) * 1;
						sendMsg(msg);
					}
				},
				move(ev) {
					let dragged = document.getElementById(ev.target.id);
					if (dragged.getAttribute('typectrl') == '2') {
						var offsetX = Math.ceil(ev.clientX - startX);
						var offsetY = Math.ceil(ev.clientY - startY);
						if (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5) {
							var form = dragged.getAttribute('hwndform');
							document.querySelectorAll('[hwndform="' + form + '"]').forEach(function (div) {
								div.style.top = div.style.top.substr(0, div.style.top.length - 2) * 1 + offsetY + 'px';
								div.style.left = div.style.left.substr(0, div.style.left.length - 2) * 1 + offsetX + 'px';
							})

							var main = document.getElementById("div_" + form);

							startX = ev.clientX;
							startY = ev.clientY;

							if (main.style.top.substr(0, 1) == '-') {
								main.style.top = '0px';
							}
							if (main.style.left.substr(0, 1) == '-') {
								main.style.left = '0px';
							}
						}
					}
				}
			}
		})
		.on('hold', OnContextMenu)
		.on('doubletap', OnDblClick)
		.on('tap', OnMouseClick)
}

async function uploader() {
	let file = document.querySelector('#uploader').files[0];
	let image = await toBase64(file);
	console.log(element);
	let msg = {
		'command': 'ActionSetImage',
		'data': {
			hwndform: element.getAttribute('hwndform'),
			hwndctrl: element.getAttribute('hwndctrl'),
			image: image
		}
	}
	sendMsg(msg);
}

const toBase64 = file => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result);
	reader.onerror = error => reject(error);
});


window.addEventListener('DOMContentLoaded', doLoad());

window.onunload = async function () {
	headdoUnload();
};
