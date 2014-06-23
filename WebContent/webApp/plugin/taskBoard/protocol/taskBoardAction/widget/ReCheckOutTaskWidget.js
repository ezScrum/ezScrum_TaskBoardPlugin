Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

/* Check out Issue Form */
EzScrum.Plugin.TaskBoard.ReCheckOutForm = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.TaskBoardCardWindowForm, {
    initComponent : function() {
        var config = {
            url     : 'resetTask.do',
            loadUrl : 'showCheckOutIssue.do',
            items   : 
            		[{
                        fieldLabel	: 'ID',
                        name      	: 'Id',
						readOnly	: true
                    },
                    {
                        fieldLabel	: 'Task Name',
                        name      	: 'Name'
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
                    	format		: 'Y/m/d-H:i:s',
                    	xtype		: 'datefield'
                    }],
            buttons : 
            		[{
						formBind : true,
                        text     : 'Reset Check Out',
                        scope    : this,
                        handler  : this.submit,
                        disabled : true
                    }, {
                        text    : 'Cancel',
                        scope   : this,
                        handler : function() {	this.ownerCt.hide();  }
                    }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        EzScrum.Plugin.TaskBoard.ReCheckOutForm.superclass.initComponent.apply(this, arguments);

        this.addEvents('RECOSuccess', 'RECOFailure', 'LoadTaskFailure');
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
					this.fireEvent('RECOSuccess', this, response, record);
				}
			}
    	}
    },
    onEditFailure: function(response) {
        this.fireEvent('RECOFailure', this, response);
    },
    onLoadSuccess: function(response) {
    	ConfirmWidget.loadData(response);
    	if (ConfirmWidget.confirmAction()) {
			EzScrum.Plugin.TaskBoard.TaskStore.loadData(Ext.decode(response.responseText));	// load task info

			var record = EzScrum.Plugin.TaskBoard.TaskStore.getAt(0);
			if(record) {
				this.getForm().setValues({
					Id: record.data['Id'],
					Name: record.data['Name'], 
					Partners: record.data['Partners'], 
					Notes: record.data['Notes'] 
				});
				
				// this.fireEvent('LoadSuccess', this, response, record);
			}
    	}
    },
    onLoadFailure: function(response) {
        this.fireEvent('LoadTaskFailure', this, response);
    },
    reset: function() {
        this.getForm().reset();
    },
    loadTask: function(id) {
        var obj = this;
    	Ext.Ajax.request({
			url: obj.loadUrl,
			success: function(response) { obj.onLoadSuccess(response); },
			failure: function(response) { obj.onLoadFailure(response); },
			params : {issueID : id}
		});
    }
});

Ext.reg('ResetCheckOutTaskForm_TaskBoard', EzScrum.Plugin.TaskBoard.ReCheckOutForm);

EzScrum.Plugin.TaskBoard.Window.ReCheckOutWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title	: 'Reset Checked Out Task',
	initComponent : function() {
		var config = {
			layout : 'form',
			items  : [{	xtype : 'ResetCheckOutTaskForm_TaskBoard'	}]
		};
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.ReCheckOutWindow.superclass.initComponent.apply(this, arguments);

		this.addEvents('RECheckOutSuccess', 'RECheckOutFailure', 'LoadFailure');		
		this.items.get(0).on('RECOSuccess', function(obj, response, record) { this.fireEvent('RECheckOutSuccess', this, response, record); }, this);
		this.items.get(0).on('RECOFailure', function(obj, response) { this.fireEvent('RECheckOutFailure', this, response); }, this);
		this.items.get(0).on('LoadTaskFailure', function(obj, response) { this.fireEvent('LoadFailure', this, response); }, this);
	},
	showWidget : function(taskID) {
		this.items.get(0).reset();
		this.items.get(0).loadTask(taskID);
		this.show();
	},
	taskCard: '',
	targetStatus: '',
	listeners:{
		LoadFailure: function(win, response) {
			Ext.MessageBox.confirm('Load Failure', 'Sorry, Load Failure');
			this.hide();
		},
		RECheckOutSuccess: function(win, response, record) {
			var obj = this;
			// 更新 plugin DB裡 issue 的狀態
			//http://localhost:8080/ezScrum/plugin/taskBoard/updateIssueStatus
			Ext.Ajax.request({
				url : 'plugin/taskBoard/updateIssueStatus',
				params : {
					sprintID : obj.taskCard.sprint, 
					issueID : obj.taskCard.taskId,
					status : obj.targetStatus
				},
				success : function(response) {
					obj.hide();
					Ext.example.msg('Reset Task', 'Success.');
					
					// move task card, 清除 handler, partner 的動作在 TaskCard.js 做了
					obj.taskCard.moveToTarget();
					obj.taskCard.updateName(record.data['Name']);
				},
				failure : function() {
					Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
				}
			});
		},
		RECheckOutFailure: function(win, response) {
			this.hide();
			Ext.MessageBox.confirm('Check Out Failure', 'Sorry, Check Out Failure');
		}
	},
	setCard: function( card, targetStatus ) {
		this.taskCard = card;
		this.targetStatus = targetStatus;
	}
});