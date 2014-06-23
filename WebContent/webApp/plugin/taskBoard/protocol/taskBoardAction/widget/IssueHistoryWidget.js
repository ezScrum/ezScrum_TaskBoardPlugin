Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');

EzScrum.Plugin.TaskBoard.IssueHistoryGridPanel = Ext.extend(Ext.grid.GridPanel, {
	url				: 'showIssueHistory.do',
	issueID			: '-1',
	store			: EzScrum.Plugin.TaskBoard.IssueHistoryListStore,
	colModel		: EzScrum.Plugin.TaskBoard.IssueHistoryListColumnModel,
	title			: ' ',
	height			: 500,
	stripeRows		: false,	
	frame			: false,
	viewConfig		: {
    	forceFit: true,
    	getRowClass: function(record, index, rowParams, store) {
    		var key_Css = ['IMPORTANCE', 'ESTIMATION', 'SPRINT', 'STATUS', 'ADD', 'DROP', 'APPEND', 'REMOVE', 'ACTUALHOUR'];
    		
    		for(var i=0 ; i<key_Css.length ; i++) {
    			if (record.get('HistoryType').toUpperCase().match(key_Css[i])) {
    				return "TASKBOARD_ISSUE_" + key_Css[i];
    			}
    		}
        }
    },
	loadDataModel	: function() {
		var obj = this;
		
		Ext.Ajax.request({
			url: obj.url,
			params: {
				issueID: obj.issueID
			},
			success : function(response) {
				ConfirmWidget.loadData(response);
    			if (ConfirmWidget.confirmAction()) {
    				EzScrum.Plugin.TaskBoard.IssueHistoryStore.loadData(Ext.decode(response.responseText));			// load issue info
    				EzScrum.Plugin.TaskBoard.IssueHistoryListStore.loadData(Ext.decode(response.responseText));    	// load issue history info
    				
    				obj.notifyTitle(EzScrum.Plugin.TaskBoard.IssueHistoryStore.getAt(0));
    			}
			},
			failure : function(){
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			}
		});
	},
	setIssueID		: function(id) {
		this.issueID = id;
	},
	notifyTitle: function(record) {
//		var title_info = '＜' + record.get('IssueType') + '＞ ' + makeIssueDetailUrl2(record.get('Link'), record.get('Id')) + ' ' + record.get('Name');
		var title_info = '＜' + record.get('IssueType') + ' ' + record.get('Id') + '＞ ' + ' ' + record.get('Name');
		title_info = '<font size="2">' + title_info + '</font>';
		
		this.setTitle(title_info);
	}
});
Ext.reg('IssueHistoryListGrid_TaskBoard', EzScrum.Plugin.TaskBoard.IssueHistoryGridPanel);

EzScrum.Plugin.TaskBoard.Window.IssueHistoryWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title		: 'Issue History List',
	autoScroll	: true,
	buttonAlign	: 'center',
	initComponent : function() {
		var config = {
			layout :'fit',
			items  : [{
				xtype: 'IssueHistoryListGrid_TaskBoard'
			}],
			buttons: [{
	        	text	: 'Close',
	        	scope	: this,
	        	handler	: function(){this.hide();}
			}]
		}
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.IssueHistoryWindow.superclass.initComponent.apply(this, arguments);
	},
	showTheWindow: function(issueID) {
    	this.items.get(0).setIssueID(issueID);
    	this.items.get(0).loadDataModel();
    	
    	this.show();
    }
});