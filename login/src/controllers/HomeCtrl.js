define(['i18n!src/nls/login.js?_=' + new Date().toISOString()], function(trans) {
	return function() {
		this.translations = trans;
		this.VIEW_NAME = 'src/views/home.mst';

		this.init = function() {
			this._loadTemplate();
		};

		this._loadTemplate = function() {
			var data = {
				i18n: this.translations
			};

			app.loadView(this.VIEW_NAME, data, this._onViewLoaded.bind(this));
		};

		this._onViewLoaded = function() {
		};
	};
});
