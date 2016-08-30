define(['i18n!src/nls/login.js?_=' + new Date().toISOString(), 'models/languages'], function(trans, langs) {
	return function() {
		this.translations = trans;
		this.languages = langs.languages;
		this.VIEW_NAME = 'src/views/login.mst';

		this.init = function() {
			this._loadTemplate();
		};

		this._loadTemplate = function() {
			var data = {
				i18n: this.translations,
				langs: this.languages
			};

			app.loadView(this.VIEW_NAME, data, this._onViewLoaded.bind(this));
		},

		this._onViewLoaded = function() {
			this._prepareForm();

			$('span.ui.tooltip').popup();
			$('.languages').dropdown('set selected', app.getSetting('language'));
			$('.languages').dropdown({
				onChange: function(value) {
					app.setSetting('language', value);
					window.location.reload();
				}
			});
		};

		this._prepareForm = function() {
			var _this = this;

			$('.ui.form').form({
				fields: {
					email: {
						identifier  : 'email',
						rules: [{
							type   : 'empty',
							prompt : _this.translations.root.pleaseEmail
						},{
							type   : 'email',
							prompt : _this.translations.root.pleaseEmailValid
						}]
					},
					password: {
						identifier  : 'password',
						rules: [{
							type   : 'empty',
							prompt : _this.translations.root.pleasePassword
						},{
							type   : 'length[6]',
							prompt : _this.translations.root.pleasePasswordValid
						}]
					}
				},
				onSuccess: function(event) {
					app.showLoading();
					event.preventDefault();
				}
			});
		};
	};
});
