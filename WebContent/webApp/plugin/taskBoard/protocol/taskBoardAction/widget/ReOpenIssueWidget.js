Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

// reopen Issue Form
EzScrum.Plugin.TaskBoard.ReOpenForm = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.TaskBoardCardWindowForm, {
	initComponent : function() {
		var config = {
			url			: 'reopenIssue.do',
			loadUrl		: 'showCheckOutIssue.do',
			items : [ {
				fieldLabel	: 'ID',
				name		: 'Id',
				readOnly	: true
			}, {
				fieldLabel	: 'Name',
				name		: 'Name'
			}, {
				fieldLabel	: 'Notes',
				xtype		: 'textarea',
				name		: 'Notes',
				height 		: 150
			}, {
				allowBlank	: true,
				fieldLabel	: 'Specific Checked Out Time',
				name		: 'ChangeDate',
				format		: 'Y/m/d-H:i:s',
				xtype		: 'datefield'
			}],
			buttons : [ {
				formBind : true,
				text : 'Re Open',
				scope : this,
				handler : this.submit,
				disabled : true
			}, {
				text : 'Cancel',
				scope : this,
				handler : function() {
					this.ownerCt.hide();
				}
			} ]
		}

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.ReOpenForm.superclass.initComponent.apply(this, arguments);

		this.addEvents('ReOSuccess', 'ReOFailure', 'LoadIssueFailure');
	},
	submit : function() {
		var form = this.getForm();
		var obj = this;

		Ext.Ajax.request( {
			url : obj.url,
			params : form.getValues(),
			success : function(response) {
				obj.onEditSuccess(response);
			},
			failure : function(response) {
				obj.onEditFailure(response);
			}
		});
	},
	onEditSuccess : function(response) {
		ConfirmWidget.loadData(response);
    	if (ConfirmWidget.confirmAction()) {
    		var rs = EzScrum.Plugin.TaskBoard.IssueJsonReader.read(response);
			if(rs.success) {
				var record = rs.records[0];
				if(record)
				{
					this.fireEvent('ReOSuccess', this, response, record);
				}
			}
    	}
	},
	onEditFailure : function(response) {
		this.fireEvent('ReOFailure', this, response);
	},
	onLoadSuccess : function(response) {
		ConfirmWidget.loadData(response);
		if (ConfirmWidget.confirmAction()) {
			EzScrum.Plugin.TaskBoard.TaskStore.loadData(Ext.decode(response.responseText)); // load issue info
			var record = EzScrum.Plugin.TaskBoard.TaskStore.getAt(0);
			if (record) {
				this.getForm().setValues( {
					Id : record.data['Id'],
					Name : record.data['Name'],
					Partners : record.data['Partners'],
					Notes : record.data['Notes']
				});

				// this.fireEvent('LoadSuccess', this, response, record);
			}
		}
	},
	onLoadFailure : function(response) {
		this.fireEvent('LoadIssueFailure', this, response);
	},
	reset : function() {
		this.getForm().reset();
	},
	loadIssue : function(id) {
		var obj = this;
		
		Ext.Ajax.request( {
			url : obj.loadUrl,
			params : { issueID : id	},
			success : function(response) { obj.onLoadSuccess(response);	},
			failure : function(response) { obj.onLoadFailure(response);	}
		});
	}
});

Ext.reg('ShowReOpenForm_TaskBoard', EzScrum.Plugin.TaskBoard.ReOpenForm);

EzScrum.Plugin.TaskBoard.Window.ReOpenIssueWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title : 'Re Opened Issue',
	initComponent : function() {
		var config = {
			layout : 'form',
			items : [ {
				xtype : 'ShowReOpenForm_TaskBoard'
			} ]
		}

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.ReOpenIssueWindow.superclass.initComponent.apply(this, arguments);

		this.addEvents('ReOpenSuccess', 'ReOpenFailure', 'LoadFailure');
		this.items.get(0).on('ReOSuccess', function(obj, response, record) { this.fireEvent('ReOpenSuccess', this, response, record); }, this);
		this.items.get(0).on('ReOFailure', function(obj, response) { this.fireEvent('ReOpenFailure', this, response); }, this);
		this.items.get(0).on('LoadIssueFailure', function(obj, response) { this.fireEvent('LoadFailure', this, response); }, this);
	},
	showWidget : function(taskID) {
		this.items.get(0).reset();
		this.items.get(0).loadIssue(taskID);
		this.show();
	},
	notifyHost: '',
	issueCard: '',
	targetStatus: '',
	listeners:{
		LoadFailure: function(win, response) {
			Ext.MessageBox.confirm('Load Failure', 'Sorry, Load Failure');
			this.hide();
		},
		ReOpenSuccess: function(win, response, record) {
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
					Ext.example.msg('Re Open Issue', 'Success.');

					// move story or task card
					obj.issueCard.moveToTarget();
					obj.issueCard.updateData(record.data);
				},
				failure : function() {
					Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
				}
			});
			
			/* 
			 * update Sprint Desc. and Burndown Chart
			 * Story Re-Open 需調整 Sprint Desc. and Burndown Chart的資訊
			 *  Task Re-Open 目前的機制是不要復原 Remain Hour, 所以 move card 就好
			 */
			if(this.issueCard.issueType == 'story') {
				var sprintID = '';
				this.notifyHost.fireEvent('notifyReloadSprintInfoForm', sprintID);
				this.notifyHost.fireEvent('notifyReloadBurndownChartForm', sprintID);
			}
		},
		ReOpenFailure: function(win, response) {
			this.hide();
			Ext.MessageBox.confirm('Re Open Issue Failure', 'Sorry, Re Open Issue Failure');
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