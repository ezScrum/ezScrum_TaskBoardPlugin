Ext.ns('EzScrum.Plugin.TaskBoard');

EzScrum.Plugin.TaskBoard.HandlerComboWidget = Ext.extend(Ext.form.ComboBox, {
	fieldLabel	: 'Handler',
    name		: 'Handler',
	editable		: false,
	triggerAction	: 'all',
	url				: 'AjaxGetHandlerList.do',
	forceSelection	: true,
	mode			: 'local',
	store			: EzScrum.Plugin.TaskBoard.HandlerComboStore,
	valueField		: 'Name',
	displayField	: 'Name',
	initComponent : function(){
	},
	listeners : {
		'expand' : function(combo) {
			var blurField = function(el) {
				el.blur();
			};
			blurField.defer(10, this, [ combo.el ]);
		},
		'collapse' : function(combo) {
			var blurField = function(el) {
				el.blur();
			};
			blurField.defer(10, this, [ combo.el ]);
		},
		'render': function() {
			this.loadDataModel();
		}
	},
	loadDataModel: function() {
		var obj = this;
		obj.selectedIndex = 0 ;
		obj.reset();
		Ext.Ajax.request({
			url: obj.url,
			success:function(response){
				obj.store.loadData(response.responseXML);		// get handler info
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			}
		});
	}
});

Ext.reg('HandlerComboBoxWidget_TaskBoard', EzScrum.Plugin.TaskBoard.HandlerComboWidget);