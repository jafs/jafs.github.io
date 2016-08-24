var current = new Date();
var language = 'es-ES';
var dayFormat = new Intl.DateTimeFormat(language, {weekday: 'long'});
var monthFormat = new Intl.DateTimeFormat(language, {month: 'long'});

function prev() {
	var month = current.getMonth();
	--month;
	current.setMonth(month);

	drawCalendar();
}

function next() {
	var month = current.getMonth();
	++month;
	current.setMonth(month);

	drawCalendar();
}

function createCell(day) {
	var td = document.createElement('td');
	var status = 'negative';
	var color = 'red';
	var div, div2, div3;

	ocupadas = Math.floor(Math.random() * 100 % 10) % 4;

	if (ocupadas === 3) {
		status = 'positive';
		color = 'green';
	} else if (ocupadas >= 1) {
		status = 'warning';
		color = 'orange';
	}

	div = document.createElement('a');
	div.setAttribute('class', 'ui ' + color + ' label');
	div.innerHTML = (day < 10 ? '0' : '') + day;
	td.appendChild(div);

	div = document.createElement('div');
	div.setAttribute('class', 'ui statistics');

	div2 = document.createElement('div');
	div2.setAttribute('class', 'ui mini horizontal green statistic');

	div3 = document.createElement('div');
	div3.setAttribute('class', 'value');
	div3.innerHTML = '<i class="hotel icon"></i> ' + ocupadas;
	div2.appendChild(div3);

	div.appendChild(div2);

	div2 = document.createElement('div');
	div2.setAttribute('class', 'ui mini horizontal red statistic');

	div3 = document.createElement('div');
	div3.setAttribute('class', 'value');
	div3.innerHTML = '<i class="trash icon"></i> ' + (3 - ocupadas);
	div2.appendChild(div3);

	div.appendChild(div2);

	td.appendChild(div);

	td.setAttribute('class', status);
	td.appendChild(div);

	div = document.createElement('div');
	div.setAttribute('class', 'ui special popup');
	div.innerHTML = ocupadas + ' Ocupadas<br />' + (3 - ocupadas) + ' Libres';

	td.appendChild(div);

	return td;
}

function drawCalendar() {
	var month = current.getMonth();
	var year = current.getFullYear();
	var last, weekDay, i, td;
	var tr = document.createElement('tr');
	var tbody = document.getElementsByTagName('tbody')[0];

	tbody.innerHTML = '';

	first = new Date(year, month, 1).getDay();
	last = new Date(year, month + 1, 0).getDate();
	day = current.getDay();

	document.getElementsByClassName('month')[0].innerHTML = monthFormat.format(current) + ' ' + year;

	if (first === 0) {
		first = 7;
	}

	tr.setAttribute('class', 'top aligned');

	if (first !== 1) {
		for (i = 0; i < first - 1; ++i) {
			td = document.createElement('td');
			td.innerHTML = '&nbsp;';
			tr.appendChild(td);
		}
	}

	weekDay = first;

	for (i = 0; i < last; ++i) {
		td = createCell(i + 1);
		tr.appendChild(td);

		if (weekDay === 7) {
			tbody.appendChild(tr);
			tr = document.createElement('tr');
			tr.setAttribute('class', 'top aligned');
			weekDay = 1;
		} else {
			++weekDay;
		}
	}

	tbody.appendChild(tr);

	$('td .label').popup();
}

function getDays() {
	var days = [];
	var date;

	for (var i = 7; i < 14; ++i) {
		date = new Date(1983, 2, i);
		days.push(dayFormat.format(date));
	}

	return days;
}

function generateDays() {
	var row = document.createElement('tr');
	var days = getDays();
	var cell;

	for (var i = 0; i < 7; ++i) {
		cell = document.createElement('th');
		cell.innerHTML = days[i];
		row.appendChild(cell);
	}

	return row;
}

function createCalendar() {
	var table = document.getElementsByClassName('calendar-table')[0];
	var head = document.createElement('thead');
	var body = document.createElement('tbody');
	var caption, row, div, button, span;

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

	// Fila de días de la semana
	row = generateDays();
	head.appendChild(row);

	head.setAttribute('class', 'full-width');

	table.appendChild(head);
	table.appendChild(body);
}

createCalendar();

drawCalendar();
