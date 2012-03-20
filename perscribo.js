function Logger () {
  var index = 0;

  this.history = []; 

  Logger.prototype.getFormattedDate = (function () {
    var date = new Date();
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
  });

  Logger.prototype.getFormattedTimestamp = (function () {
    return ( new Date().getTime() );
  });


  Logger.prototype.isLocal = (function () {
    return (window.location.hostname.indexOf('127.0.0.1') > -1 || window.location.hostname.indexOf('localhost') > -1);
  });


  Logger.prototype.initialized = { 'status': false, 'date': this.getFormattedDate() };

  Logger.prototype.log_levels = [ { 'id': 'info', 'priority': 0 }, 
                              { 'id': 'error', 'priority': 1 }, 
                              { 'id': 'warn',  'priority': 2 },
                              { 'id': 'debug',  'priority': 3 }  ];

  Logger.prototype.defaults = { 'log_level': 'error' };
  Logger.prototype.options = this.isLocal() ? { 'log_level': 'debug', 'revert_after_delay': 5000 } : this.defaults;

  Logger.prototype.getLocalStore = (function () {
	try {
      var localStore;
      if (window.sessionStorage) {
        localStore = window.sessionStorage
      } else if (window.localStorage) {
        localStore = window.localStorage;
      }
      return localStore;
    } catch (e) {
      // don't go here yet
    }
  });

  Logger.prototype.localStoreKey = (function () {
    if (localStorage) {
      var current_key = ['Logger', this.initialized.date].join('.');
      if (!this.initialized.status) {
        var current_level = this.getConfigItem('log_level'), localStore = this.getLocalStore();

        var config_revert_after_delay = localStore.getItem('Logger.config.revert_after_delay'), current_logger = this;
        if (config_revert_after_delay) {
          setTimeout((function () {
            current_logger.removeConfigItem('log_level');
            current_logger.info('Log level automatically reverted (level: error)');
          }), parseInt(config_revert_after_delay));
        }

        var config_log_level = localStore.getItem('Logger.config.log_level');
        if (config_log_level) {
          this.options.log_level = config_log_level;
        }

        localStore.setItem(current_key, JSON.stringify({ 'history': [] }));

        this.initialized.status = true;
      }
      return current_key;
    }
  });

  Logger.prototype.getStorage = (function () {
	try {
      var current_key = this.localStoreKey(), localStore = this.getLocalStore();
      var storage = localStore.getItem(current_key).evalJSON();
      return storage;
    } catch (e) {
      // don't go here yet
    }
  });

  Logger.prototype.getHistory = (function () {
    return this.getStorage()['history'];
  });

  Logger.prototype.writeHistory = (function (log_entry) {
    var current = this.getStorage(), current_key = ['Logger', this.initialized.date].join('.'), localStore = this.getLocalStore();
	try {
      current['history'].push(log_entry);
      localStore.setItem(current_key, JSON.stringify(current));
    } catch (e) {
      this.history.push(log_entry);
    }
  });

  Logger.prototype.InfoLog = (function (params) {
	this.log_level = 'info';
	
    this.content = params.content;
    this.timestamp = params.timestamp;

    Logger.prototype.InfoLog.prototype.toString = (function () {
      return [this.log_level.capitalize(), this.content].join(': ');
    });
  });

  Logger.prototype.info = (function (content) {
	this.doLog(new Logger.prototype.InfoLog({ 'content': content, 'timestamp': this.getFormattedTimestamp() }));
  });

  Logger.prototype.ErrorLog = (function (params) {
	this.log_level = 'error';
	
    this.content = params.content;
    this.timestamp = params.timestamp;

    Logger.prototype.ErrorLog.prototype.toString = (function () {
      return [this.log_level.capitalize(), this.content].join(': ');
    });
  });

  Logger.prototype.error = (function (content) {
	this.doLog(new Logger.prototype.ErrorLog({ 'content': content, 'timestamp': this.getFormattedTimestamp() }));
  });

  Logger.prototype.WarnLog = (function (params) {
	this.log_level = 'warn';
	
    this.content = params.content;
    this.timestamp = params.timestamp;

    Logger.prototype.WarnLog.prototype.toString = (function () {
      return [this.log_level.capitalize(), this.content].join(': ');
    });
  });

  Logger.prototype.warn = (function (content) {
	this.doLog(new Logger.prototype.WarnLog({ 'content': content, 'timestamp': this.getFormattedTimestamp() }));
  });

  Logger.prototype.DebugLog = (function (params) {
	this.log_level = 'debug';
	
    this.content = params.content;
    this.timestamp = params.timestamp;

    Logger.prototype.DebugLog.prototype.toString = (function () {
      return [this.log_level.capitalize(), this.content].join(': ');
    });
  });

  Logger.prototype.debug = (function (content) {
	this.doLog(new Logger.prototype.DebugLog({ 'content': content, 'timestamp': this.getFormattedTimestamp() }));
  });

  Logger.prototype.getLevel = (function (id) {
    return this.log_levels.find(function (i) {
      return ( i.id == id );
    });
  });

  Logger.prototype.doLog = (function (log_entry) {
	var config_log_level = this.getConfigItem('log_level');
	if (config_log_level) {
      if (config_log_level != this.options.log_level) {
        this.options.log_level = config_log_level;
      }
	} else { 
      this.options.log_level = this.defaults.log_level;
    }
	
    if (this.getLevel(log_entry.log_level).priority <= this.getLevel(this.options.log_level).priority) {
      try {
        console.log(index + ' | ' + log_entry.toString());
      } catch (e) {
        // do something extra fancy here
      }
      this.writeHistory(log_entry);
      index = index + 1;
    }
  });

  Logger.prototype.getConfigKey = (function (key, value) {
    return ['Logger', 'config', key].join('.');
  });

  Logger.prototype.removeConfigItem = (function (key, value) {
    var config_key = this.getConfigKey(key), localStore = this.getLocalStore();
    return localStore.removeItem(config_key);
  });

  Logger.prototype.getConfigItem = (function (key, value) {
    var config_key = this.getConfigKey(key), localStore = this.getLocalStore();
    return localStore.getItem(config_key);
  });

  Logger.prototype.setConfigItem = (function (key, value) {
    var config_key = this.getConfigKey(key), localStore = this.getLocalStore();
    localStore.setItem(config_key, value);
    return this.getConfigItem(key);
  });

  Logger.prototype.clearConfig = (function () {
    var localStore = this.getLocalStore();
    localStore.removeItem('Logger.config.log_level');
    localStore.removeItem('Logger.config.revert_after_delay');
    return true;
  });

  this.setConfigItem('log_level', this.options.log_level);
  this.setConfigItem('revert_after_delay', this.options.revert_after_delay);
  this.info('Logger initialized (level: ' + this.getConfigItem('log_level') + ')');
}