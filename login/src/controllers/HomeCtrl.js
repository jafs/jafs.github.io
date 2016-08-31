define(['i18n!src/nls/home.js?_=' + new Date().toISOString()], function(trans) {
	return function() {
		this.translations = trans;
		this.VIEW_NAME = 'src/views/home.mst';

		var exampleData = [{
			status: 'check circle green',
			title: 'Control de precios para temporadas',
			description: 'Sería buena idea poder disponer de un sistema que ayude a configurar diferentes temporadas y precios para las mismas.',
			creationDate: '10-11-2016',
			closeDate: '11-11-2016'
		},{
			status: 'selected radio orange',
			title: 'Control de ocupantes por habitación',
			description: 'Me gustaría poder tener una estadística que muestre la media de ocupantes por habitación, de forma que pueda saber si se llenan las habitaciones.',
			creationDate: '10-11-2016',
			closeDate: '11-11-2016'
		},{
			status: 'remove circle red',
			title: 'Ahora unos ejemplos',
			description: 'Pues eso vamos a ver unos ejemplos de como se puede poner un comentario para los tickes.',
			creationDate: '10-11-2016',
			closeDate: '11-11-2016'
		}];

		this.init = function() {
			this._loadTemplate();
		};

		this._loadTemplate = function() {
			var data = {
				i18n: this.translations,
				data: exampleData
			};

			app.loadView(this.VIEW_NAME, data, this._onViewLoaded.bind(this));
		};

		this._onViewLoaded = function() {
			$('.logout')
				.off('click')
				.on('click', function() {
					app.loadController('LoginCtrl');
				});

			$('.home-ctrl')
				.off('click', 'tr')
				.on('click', 'tr', function() {
					if ($(this).hasClass('active')) {
						$(this).removeClass('active');
						$('.ui.buttons .button').addClass('disabled');
					} else {
						$(this).siblings().removeClass('active');
						$(this).addClass('active');
						$('.ui.buttons .button').removeClass('disabled');
					}
				});

				$('.home-ctrl')
					.off('click', 'h4 a')
					.on('click', 'h4 a', function(event) {
						event.stopPropagation();
						$('.ui.modal').modal('show');
					});
		};
	};
});
