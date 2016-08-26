var current = new Date();
var language = 'es-ES';
var monthFormat = new Intl.DateTimeFormat(language, {month: 'long'});

function prev() {
	var month = current.getMonth();
	--month;
	current.setMonth(month);

	changeMonth();
}

function next() {
	var month = current.getMonth();
	++month;
	current.setMonth(month);

	changeMonth();
}

function createDay(day, weekend) {
	var th = document.createElement('th');
	var text = document.createTextNode(day);

	th.setAttribute('class', 'center aligned ' + (weekend ? 'weekend' : ''));

	th.appendChild(text);

	return th;
}

function generateDays() {
	var month = current.getMonth();
	var year = current.getFullYear();
	var last, i, td;
	var tr = document.createElement('tr');

	weekDay = new Date(year, month, 1).getDay();
	last = new Date(year, month + 1, 0).getDate();

	document.getElementsByClassName('month')[0].innerHTML = monthFormat.format(current) + ' ' + year;

	if (weekDay === 0) {
		weekDay = 7;
	}

	tr.setAttribute('class', 'top aligned');

	tr.appendChild(document.createElement('th'));

	for (i = 0; i < last; ++i) {
		td = createDay(i + 1, weekDay > 5);
		tr.appendChild(td);

		if (weekDay === 7) {
			weekDay = 1;
		} else {
			++weekDay;
		}
	}

	return tr;
}

function changeMonth() {
	// Fila de días de la semana
	var head = document.getElementsByTagName('thead')[0];
	var row = generateDays();

	head.innerHTML = '';
	head.appendChild(row);
	drawRooms();
}

function createCalendar() {
	var table = document.getElementsByClassName('calendar-table')[0];
	var head = document.createElement('thead');
	var body = document.createElement('tbody');
	var caption, div, button, span;

	head.setAttribute('class', 'full-width');

	// Cabecera
	caption = document.createElement('caption');

	// Botón de mes anterior.
	button = document.createElement('button');
	button.setAttribute('class', 'ui icon button left floated');
	button.setAttribute('title', 'Anterior');
	button.addEventListener('click', prev);

	span = document.createElement('i');
	span.setAttribute('class', 'angle double left icon');

	button.appendChild(span);
	caption.appendChild(button);

	// Zona central con mes y año
	div = document.createElement('div');
	div.setAttribute('class', 'ui label');

	span = document.createElement('i');
	span.setAttribute('class', 'calendar icon');
	div.appendChild(span);

	span = document.createElement('span');
	span.setAttribute('class', 'month');
	div.appendChild(span);

	caption.appendChild(div);

	// Botón de mes siguiente
	button = document.createElement('button');
	button.setAttribute('class', 'ui icon button right floated');
	button.setAttribute('title', 'Siguiente');
	button.addEventListener('click', next);

	span = document.createElement('i');
	span.setAttribute('class', 'angle double right icon');

	button.appendChild(span);
	caption.appendChild(button);

	table.appendChild(caption);

	table.appendChild(head);
	table.appendChild(body);

	changeMonth();
}


function drawRooms() {
	var rooms = ['Primera', 'Segunda', 'Tercera', 'Cuarta'];
	var tbody = document.getElementsByTagName('tbody')[0];
	var tr;

	tbody.innerHTML = '';

	for (var i = 0; i < rooms.length; ++i) {
		tr = drawRoom(rooms[i]);
		tbody.appendChild(tr);
	}
}


function drawRoom(roomName) {
	var month = current.getMonth();
	var year = current.getFullYear();
	var lastDay, td, text, status;
	var tr = document.createElement('tr');

	lastDay = new Date(year, month + 1, 0).getDate();

	td = document.createElement('td');
	text = document.createTextNode(roomName);
	td.appendChild(text);

	tr.appendChild(td);


	for (var i = 0; i < lastDay; ++i) {
		td = document.createElement('td');
		status = Math.floor(Math.random() * 100 % 10) % 2;

		if (status) {
			td.setAttribute('class', 'negative');
		} else {
			td.setAttribute('class', 'positive');
		}

		td.setAttribute('data-room', roomName);
		td.setAttribute('data-day', i + 1);

		tr.appendChild(td);
	}

	return tr;
}

createCalendar();
drawRooms();


$('.calendar-table').on('click', 'td', function(event) {
	if ($(event.currentTarget)[0] !== $(event.currentTarget).closest('tr').find('td')[0]) {
		var room = event.currentTarget.getAttribute('data-room');
		var day = event.currentTarget.getAttribute('data-day');
		var html = '<div class="header">Habitación ' + room + '</div>';

		if (event.currentTarget.getAttribute('class') === 'positive') {
			html += '<div class="content">La habitación está libre</div>';
		} else {
			html += '<div class="content"><a href="#" title="Detalles de la reserva" ' +
				'class="popup-modal"><b>John Doe</b></a> ' +
				'está alojado el día ' + day + '</div>';
		}

		$(event.currentTarget).popup({
			html: html,
			hoverable: true,
			onHidden: function() {
				$(event.currentTarget).popup('remove popup').popup('destroy');
			}
		}).popup('show');

		$('.popup-modal').popup({
			onHidden: function(target) {
				$(target).popup('remove popup').popup('destroy');
			}
		});
	}
});
