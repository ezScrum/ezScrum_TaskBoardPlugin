Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');
Ext.ns('EzScrum.Plugin.TaskBoard.Layout');

/* Create Task Form */
EzScrum.Plugin.TaskBoard.EditTaskForm = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.TaskBoardCardWindowForm, {
	// Default issue id
	issueId : '-1',
	notifyPanel : undefined,
	initComponent:function() {
		
		var config = {
			// Ajax edit Task url 
			url : 'ajaxEditTask.do',
			// Ajax load Task url
			loadUrl : 'getEditTaskInfo.do',
			items: [{
		            fieldLabel: 'ID',
		            name: 'issueID',
					readOnly:true
		        }, {
		            fieldLabel: 'Name',
		            name: 'Name',
		            allowBlank: false,	
					maxLength: 128
		        }, {
		        	fieldLabel: 'Handler',
		            name: 'HandlerComboBox_ForEditTask',
		            xtype: 'HandlerComboBoxWidget_TaskBoard',		            
		            allowNegative: false
		        }, 
		        {	
		        	ref			: 'PartnerWidget',
		        	xtype		: 'PartnerWidget_TaskBoard'
		        },
		        {
		            fieldLabel: 'Estimation',
		            name: 'Estimation',
		            vtype:'Float'
		        }, {
		        	fieldLabel: 'Remains',
		            name: 'Remains',
		            vtype:'Float'
		        },  {
		        	fieldLabel: 'Actual',
		            name: 'Actual',
		            vtype:'Float'
		        }, {
		        	fieldLabel: 'Notes',
		            xtype: 'textarea',
		            name: 'Notes',
		            height:200
		        }, {
		            name: 'sprintId',
		            hidden: true
		        }
		    ],
		    buttons: 
		    [{
		    	formBind:true,
	    		text: 'Submit',
	    		scope:this,
	    		handler: this.submit
	    	},
	        {
	        	text: 'Cancel',
	        	scope:this,
	        	handler: function(){this.ownerCt.hide();}
	        }]
        };
        
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.EditTaskForm.superclass.initComponent.apply(this, arguments);
		this.HandlerCombo = this.items.items[2];
	},
	onRender:function() {
		EzScrum.Plugin.TaskBoard.EditTaskForm.superclass.onRender.apply(this, arguments);
		this.getForm().waitMsgTarget = this.getEl();
	},
	// Edit Task action 
	submit : function()
	{
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.show();	
		var obj = this;
		var form = this.getForm();

		Ext.Ajax.request({
			url:this.url,
			params:form.getValues(),
			success:function(response){obj.onEditSuccess(response);},
			failure:function(response){obj.onEditFailure(response);}
		});
	},
	// Load Task success
	onLoadSuccess:function(response) 
	{
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();
		
		ConfirmWidget.loadData(response);
		if (ConfirmWidget.confirmAction()) {
			var rs = EzScrum.Plugin.TaskBoard.TaskXMLReader.readRecords(response.responseXML);
			if(rs.success) {
				var record = rs.records[0];
				if(record) {
					
					this.HandlerCombo.originalValue = record.data['Handler'];
					this.HandlerCombo.reset();
					
					this.getForm().reset();
					this.getForm().setValues({
						issueID	: record.data['Id'], 
						Name	: record.data['Name'], 
						Partners: record.data['Partners'],
						Estimation	: record.data['Estimation'], 
						Actual	: record.data['Actual'],
						Notes	: record.data['Notes'],
						Remains	: record.data['Remains']
					});
				}
			}
		}
	},
	onLoadFailure:function(response) {
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();
		this.hide();
		Ext.example.msg('Load Task', 'Load Task Failure');
	},
	// Update Task success
	onEditSuccess:function(response) {
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();
		
		var success = false;
    	var record = undefined;
		
		ConfirmWidget.loadData(response);
		if (ConfirmWidget.confirmAction()) {
			var rs = EzScrum.Plugin.TaskBoard.TaskXMLReader.readRecords(response.responseXML);
			if(rs.success) {
				var record = rs.records[0];
				if(record) {
					// 通知各個observer做更新
					this.notifyPanel.notify_EditTask(record);
				}
			} else {
				this.onEditFailure(response);
			}
		}
	},
	// Update Task failure
	onEditFailure:function(response) 
	{
		var myMask = new Ext.LoadMask(this.getEl(), {msg:"Please wait..."});
		myMask.hide();
		this.hide();
		Ext.example.msg('EditTask','Edit Task Failure.');
	},
	loadStore : function() {
		var obj = this;
		var myMask = new Ext.LoadMask(obj.getEl(), {
			msg : "Please wait..."
		});
		myMask.show();
		Ext.Ajax.request({
			url : obj.loadUrl,
			params : {
				issueID : obj.issueId,
				sprintID : obj.sprintId
			},
			success : function(response) {
				obj.onLoadSuccess(response);
			},
			failure : function(response) {
				obj.onLoadFailure(response);
			}
		});
		
		Ext.Ajax.request({
			url: 'AjaxGetPartnerList.do',
			success: function(response) { 
				obj.PartnerWidget.loadData(response); 
			}
		});
	},
	reset:function() {
		this.getForm().reset();
	}
});
Ext.reg('EditTaskForm_TaskBoard', EzScrum.Plugin.TaskBoard.EditTaskForm);

EzScrum.Plugin.TaskBoard.Window.EditTaskWindow = Ext.extend(EzScrum.Plugin.TaskBoard.Layout.Window, {
	title:'Edit Task',
	initComponent:function() {
		var config = {
			layout:'form',
			items : [{xtype:'EditTaskForm_TaskBoard'}]
        };
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Window.EditTaskWindow.superclass.initComponent.apply(this, arguments);
	},
	loadEditTask:function(sprintID, issueId, panel){
		// 儲存對應的 panel，以 Observer 的形式各自運算 
		this.items.get(0).notifyPanel = panel;

		this.items.get(0).issueId = issueId;

		this.items.get(0).reset();
		this.items.get(0).getForm().setValues({sprintId : sprintID});

		this.show();
		this.items.get(0).loadStore();
	}
});