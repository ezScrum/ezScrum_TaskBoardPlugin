Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

/* Check out Issue Form */
EzScrum.Plugin.TaskBoard.DoneForm = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.TaskBoardCardWindowForm, {
    initComponent : function() {
        var config = {
            url     : 'doneIssue.do',
            loadUrl : 'showCheckOutIssue.do',
            items   : 
            		[{
                        fieldLabel	: 'ID',
                        name      	: 'Id',
                        readOnly	: true
                    },
                    {
                        fieldLabel	: 'Name',
                        name      	: 'Name'
                    },
                    {
                    	fieldLabel	: 'Actual Hour',
                    	name      	: 'Actualhour'
                    },
                    {
                        fieldLabel	: 'Notes',
                        xtype     	: 'textarea',
                        name      	: 'Notes',
                        height    	: 150
                    },
                    {
                    	allowBlank	: true,
                    	fieldLabel	: 'Specific Checked Out Time',
                    	name		: 'ChangeDate',
                    	format 		: 'Y/m/d-H:i:s',
                    	xtype		: 'datefield'
                    }],
            buttons : 
            		[{
						formBind : true,
                        text     : 'Done',
                        scope    : this,
                        handler  : this.submit,
                        disabled : true
                    }, {
                        text    : 'Cancel',
                        scope   : this,
                        handler : function() {	this.ownerCt.hide();  }
                    }]
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        EzScrum.Plugin.TaskBoard.DoneForm.superclass.initComponent.apply(this, arguments);

        this.addEvents('DOSuccess', 'DOFailure', 'LoadIssueFailure');
    },
    submit: function() {
        var form = this.getForm();
        var obj = this;
        
        Ext.Ajax.request({
			url     : this.url,
			params  : form.getValues(),
			success : function(response) {
				obj.onEditSuccess(response);
			},
			failure : function(response) {
				obj.onEditFailure(response);
			}		
		});
    },
    onEditSuccess: function(response) {
    	ConfirmWidget.loadData(response);
    	if (ConfirmWidget.confirmAction()) {
    		var rs = EzScrum.Plugin.TaskBoard.IssueJsonReader.read(response);
			if(rs.success) {
				var record = rs.records[0];
				if(record)
				{
					this.fireEvent('DOSuccess', this, response, record);
				}
			}
    	}
    },
    onEditFailure: function(response) {
        this.fireEvent('DOFailure', this, response);
    },
    onLoadSuccess: function(response) {
    	ConfirmWidget.loadData(response);
    	if (ConfirmWidget.confirmAction()) {
    		EzScrum.Plugin.TaskBoard.TaskStore.loadData(Ext.decode(response.responseText));		// load issue info
			var record = EzScrum.Plugin.TaskBoard.TaskStore.getAt(0);
			if(record) {
				this.getForm().setValues({
					Id: record.data['Id'],
					Name: record.data['Name'], 
					Partners: record.data['Partners'], 
					Notes: record.data['Notes'],
					Actualhour: 0
				});
				
				//this.fireEvent('LoadSuccess', this, response, record);
			}
    	}
    },
    onLoadFailure: function(response) {
        this.fireEvent('LoadIssueFailure', this, response);
    },
    reset: function() {
        this.getForm().reset();
    },
    loadIssue: function(id) {
        var obj = this;
        
    	Ext.Ajax.request({
			url: this.loadUrl,
			success: function(response) { obj.onLoadSuccess(response); },
			failure: function(response) { obj.onLoadFailure(response); },
			params : {issueID : id}
		});
    }
});

Ext.reg('ShowIssueDoneForm_TaskBoard', EzScrum.Plugin.TaskBoard.DoneForm);

EzScrum.Plugin.TaskBoard.Window.DoneIssueWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title	: 'Done Issue',
	initComponent : function() {
		var config = {
			layout : 'form',
			items  : [{	xtype : 'ShowIssueDoneForm_TaskBoard'	}]
		};
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.DoneIssueWindow.superclass.initComponent.apply(this, arguments);

		this.addEvents('DoneSuccess', 'DoneFailure', 'LoadFailure');		
		this.items.get(0).on('DOSuccess', function(obj, response, record) { this.fireEvent('DoneSuccess', this, response, record); }, this);
		this.items.get(0).on('DOFailure', function(obj, response) { this.fireEvent('DoneFailure', this, response); }, this);
		this.items.get(0).on('LoadIssueFailure', function(obj, response) { this.fireEvent('LoadFailure', this, response); }, this);
	},
	showWidget : function(taskID) {
		this.items.get(0).reset();
		this.items.get(0).loadIssue(taskID);
		this.show();
	},
	notifyHost: '',
	issueCard: '', // story or task
	targetStatus: '',
	listeners:{
		LoadFailure: function(win, response) {
			Ext.MessageBox.confirm('Load Failure', 'Sorry, Load Failure');
			this.hide();
		},
		DoneSuccess: function(win, response, record) {
			var obj = this;
			// 更新 plugin DB裡 issue 的狀態
			//http://localhost:8080/ezScrum/plugin/taskBoard/updateIssueStatus
			Ext.Ajax.request({
				url : 'plugin/taskBoard/updateIssueStatus',
				params : {
					sprintID : obj.issueCard.sprint, 
					issueID : obj.issueCard.taskId,
					status : obj.targetStatus
				},
				success : function(response) {
					obj.hide();
					Ext.example.msg('Done Issue', 'Success.');
					
					// move story or task card
					obj.issueCard.moveToTarget();
					obj.issueCard.updateData(record.data);
					
					// update Sprint Desc. and Burndown Chart
					var sprintID = '';
					obj.notifyHost.fireEvent('notifyReloadSprintInfoForm', sprintID);
					obj.notifyHost.fireEvent('notifyReloadBurndownChartForm', sprintID);
				},
				failure : function() {
					Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
				}
			});
		},
		DoneFailure: function(win, response) {
			this.hide();
			Ext.MessageBox.confirm('Done Issue Failure', 'Sorry, Done Issue Failure');
		}
	},
	setNotifyHost: function(host){
		this.notifyHost = host;
	},
	setCard: function( card, targetStatus ) {
		this.issueCard = card;
		this.targetStatus = targetStatus;
	}
});