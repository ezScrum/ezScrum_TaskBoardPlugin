Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

// Check out Issue Form
EzScrum.Plugin.TaskBoard.CheckOutForm = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.TaskBoardCardWindowForm, {
    initComponent : function() {
        var config = {
            url     : 'checkOutTask.do',
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
    		            xtype		: 'HandlerComboBoxWidget_TaskBoard'
    		        },
    		        {	
    		        	ref			: 'PartnerWidget',
    		        	xtype		: 'PartnerWidget_TaskBoard'
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
                        text     : 'Check Out',
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
        EzScrum.Plugin.TaskBoard.CheckOutForm.superclass.initComponent.apply(this, arguments);

        this.handlerCombo = this.items.items[2];
        this.addEvents('COSuccess', 'COFailure', 'LoadTaskFailure');
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
					this.fireEvent('COSuccess', this, response, record);
				}
			} else {
				this.fireEvent('COFailure', this, response);
			}
		}
    },
    onEditFailure: function(response) {
        this.fireEvent('COFailure', this, response);
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
				
				this.handlerCombo.originalValue = record.data['Handler'];
				this.handlerCombo.reset();
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
			params : {issueID : id},
			success: function(response) { 
				obj.onLoadSuccess(response);
			},
			failure: function(response) { obj.onLoadFailure(response); }
		});
		
		Ext.Ajax.request({
			url: 'AjaxGetPartnerList.do',
			success: function(response) { 
				obj.PartnerWidget.loadData(response); 
			}
		});
    }
});
//reg id add "_TaskBoard" to avoid global conflict
Ext.reg('CheckOutTaskForm_TaskBoard', EzScrum.Plugin.TaskBoard.CheckOutForm);

EzScrum.Plugin.TaskBoard.Window.CheckOutWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title	: 'Check Out Task',
	initComponent : function() {
		var config = {
			layout : 'form',
			items  : [{	xtype : 'CheckOutTaskForm_TaskBoard'}]
		};
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.CheckOutWindow.superclass.initComponent.apply(this, arguments);

		this.addEvents('CheckOutSuccess', 'CheckOutFailure', 'LoadFailure');		
		this.items.get(0).on('COSuccess', function(obj, response, record) { this.fireEvent('CheckOutSuccess', this, response, record); }, this);
		this.items.get(0).on('COFailure', function(obj, response) { this.fireEvent('CheckOutFailure', this, response); }, this);
		this.items.get(0).on('LoadTaskFailure', function(obj, response) { this.fireEvent('LoadFailure', this, response); }, this);
	},
	getFormValues:function(valueName) {
		return this.items.get(0).getForm().getValues();
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
		CheckOutSuccess: function(win, response, record) {
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
					Ext.example.msg('Check Out Task', 'Success.');
					
					// update task data : name, handler, partners, note
					obj.taskCard.moveToTarget();
					obj.taskCard.updateData(record.data);
				},
				failure : function() {
					Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
				}
			});
		},
		CheckOutFailure: function(win, response) {
			this.hide();
			Ext.MessageBox.confirm('Check Out Failure', 'Sorry, Check Out Failure');
		}
	},
	setCard: function( card, targetStatus ) {
		this.taskCard = card;
		this.targetStatus = targetStatus;
	}
});