var app = new function() {
	var _$body = $('body');
	var _language = typeof navigator === 'undefined' ? 'root' :
		((navigator.languages && navigator.languages[0]) ||
		navigator.language ||
		navigator.userLanguage || 'root').toLowerCase();
	var _config = {
		language: ''
	};
	var CONFIG_KEY = 'config';

	var _initConfig = function() {
		_config.language = _language;
	};

	var _dumpConfig = function() {
		if (localStorage) {
			localStorage.setItem(CONFIG_KEY, JSON.stringify(_config));
		} else {
			document.cookie = JSON.stringify(_config);
		}
	};

	this.showLoading = function() {
		_$body.dimmer({closable: false}).dimmer('show');
	};

	this.hideLoading = function() {
		_$body.dimmer('hide');
	};

	this.loadConfig = function() {
		var readedConfig = '';
		var init = true;

		if (localStorage) {
			readedConfig = localStorage.getItem(CONFIG_KEY);
		} else if (document.cookie) {
			readedConfig = document.cookie;
		}

		if (readedConfig) {
			try {
				_config = JSON.parse(readedConfig);
				if (_config.language) {
					init = false;
				}
				return;
			} catch (e) {
			}
		}

		if (init) {
			_initConfig();
		}

		_dumpConfig();
	};

	this.setSetting = function(key, value) {
		_config[key] = value;
		_dumpConfig();
	};

	this.getSetting = function(key) {
		return _config[key];
	};

	this.loadView = function(view, data, callback) {
		$.get(view + '?_=' + new Date().getTime()).done(function(template) {
			var rendered = Mustache.render(template, data);
			$('#container')
				.empty()
				.append($(rendered));
			callback();
		});
	};
};

app.loadConfig();


require.config({
	baseUrl: 'src',
	config: {
		// Set the config for the i18n module ID
		i18n: {
			locale: app.getSetting('language')
		}
	}
});

app.showLoading();

require(['controllers/LoginCtrl'], function (LoginCtrl) {
	var loginCtrl = new LoginCtrl();
	loginCtrl.init();
	app.hideLoading();
});
