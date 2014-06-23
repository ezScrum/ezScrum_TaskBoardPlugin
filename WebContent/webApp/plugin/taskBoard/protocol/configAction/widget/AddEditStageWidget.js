Ext.ns('EzScrum.Plugin.TaskBoard.Config.Window');

/* Manage Stage Form */
EzScrum.Plugin.TaskBoard.Config.Window.ManageStageForm = Ext.extend(Ext.form.FormPanel, {
	bodyStyle: 'padding:15px',
	border : false,
	defaultType: 'textfield',
	labelAlign : 'right',
	labelWidth : 100,
	defaults: {
        width: 500,
        msgTarget: 'side'
    },
    monitorValid:true,
	initComponent:function() {	
		var config = {
			items: [{
		            fieldLabel: 'Name',
		            name: 'Name',
		            allowBlank: false,
		            maxLength: 128
		        }, {
		        	fieldLabel: 'Description',
		            xtype: 'textarea',
		            name: 'Description',
		            height:100
		        }, {
		            fieldLabel: 'WIP Limit',
		            xtype: 'numberfield',
		            name: 'WIP Limit',
		            allowBlank: false,
		            emptyText: 'Minimum is 0, and Maximum is 99',
		            minValue: 0,
		            maxValue: 99,
		            maxLength: 2
		        }
		    ],
		    buttons: 
		    [{
		    	scope: this,
		    	formBind:true,
	    		text: 'Submit',
	    		handler: this.submit,
	    		disabled:true
	    	},
	        {
	        	text: 'Cancel',
	        	scope:this,
	        	handler: function(){this.ownerCt.hide();}
	        }]
        };
        
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.Window.ManageStageForm.superclass.initComponent.apply(this, arguments);
	},
	onRender:function() {
		EzScrum.Plugin.TaskBoard.Config.Window.ManageStageForm.superclass.onRender.apply(this, arguments);
		this.getForm().waitMsgTarget = this.getEl(); // ??
	},
	submit : function()	{
		var name = this.getForm().findField("Name").getValue();
		var description = this.getForm().findField("Description").getValue();
		var wip = this.getForm().findField("WIP Limit").getValue();
		
		// fire event, call the method at window
		this.fireEvent('submit info', name, description, wip );
	},
	reset:function(){
		this.getForm().reset();
		this.items.get(2).enable();
	},
	loadData : function( clickedPanel ){
		var stageInfo = getWorkStageInfo_TaskBoardConfig( clickedPanel.id );

		this.getForm().findField("Name").setValue( stageInfo.name );
		this.getForm().findField("Description").setValue( stageInfo.description );
		
		if( clickedPanel.items.length > 0 ){
			this.getForm().findField("WIP Limit").setValue( "0" );
			this.items.get(2).disable();
		}else{
			var wip = 0;
			if( stageInfo.wip > 0 ){
				wip = stageInfo.wip;
			}
			this.getForm().findField("WIP Limit").setValue( stageInfo.wip );
		}
	}
});
Ext.reg('manageStageForm_TaskBoard', EzScrum.Plugin.TaskBoard.Config.Window.ManageStageForm);


// Add new stage (level one)
// default insert 的位置在 Done 前面
EzScrum.Plugin.TaskBoard.Config.Window.AddStageWindow = Ext.extend(Ext.Window, {
	title:'Add New Stage',
	width:700,
	modal:true,
	closeAction:'hide',
	initComponent:function() {
		var config = {
			layout:'form',
			items : [{xtype:'manageStageForm_TaskBoard',
					  ref  :'addStageForm'}]
        };

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.Window.AddStageWindow.superclass.initComponent.apply(this, arguments);
	},
	showWidget:function( notifyPanel ){
		this.notifyPanel = notifyPanel;
		
		// reset form
		this.addStageForm.reset();
		
		// set event for widget submit
		this.addStageForm.addEvents('submit info');
		this.addStageForm.on('submit info', this.addStageRequest, this);
		
		this.show();
	},
	addStageRequest : function( name, description, wip ){
		this.hide();
		showMask_TaskBoardConfig();
		
		var sprintID = this.notifyPanel.getComboSprintID();
		
		Ext.Ajax.request({
			scope	: this,
			url		: 'plugin/taskBoard/config/manageStage/addWorkStage',
			params  :{
				sprintID : sprintID,
				name : name,
				description : description,
				wip : wip
			},
			success : function(response) {
				Ext.example.msg('Add Stage', 'Add Stage Success.');
				this.notifyPanel.fireEvent('resetWorkStagesEvent', '');
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			},
			callback : function(){
				hideMask_TaskBoardConfig();
			}
		});
	}
});


// Add new "sub stage" (level two)
// default 從子階段中 append加入
EzScrum.Plugin.TaskBoard.Config.Window.AddSubStageWindow = Ext.extend(Ext.Window, {
	title:'Add New SubStage',
	width:700,
	modal:true,
	closeAction:'hide',
	initComponent:function() {
		var config = {
			layout:'form',
			items : [{xtype:'manageStageForm_TaskBoard',
					  ref  :'addSubStageForm'}]
        };

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.Window.AddSubStageWindow.superclass.initComponent.apply(this, arguments);
	},
	showWidget:function( notifyPanel ){
		this.notifyPanel = notifyPanel;
		
		// reset form
		this.addSubStageForm.reset();
		
		// set event for widget submit
		this.addSubStageForm.addEvents('submit info');
		this.addSubStageForm.on('submit info', this.addSubStageRequest, this);
		
		this.show();
	},
	addSubStageRequest : function( name, description, wip ){
		this.hide();
		showMask_TaskBoardConfig();
		
		var sprintID = this.notifyPanel.getComboSprintID();
		var parentID = this.notifyPanel.clickedPanel.id;
		
		Ext.Ajax.request({
			scope	: this,
			url		: 'plugin/taskBoard/config/manageStage/addWorkSubStage',
			params  :{
				sprintID : sprintID,
				parentID : parentID,
				name : name,
				description : description,
				wip : wip
			},
			success : function(response) {
				Ext.example.msg('Add SubStage', 'Add SubStage Success.');
				this.notifyPanel.fireEvent('resetWorkStagesEvent', '');
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			},
			callback : function(){
				hideMask_TaskBoardConfig();
			}
		});
	}
});


// edit stage
EzScrum.Plugin.TaskBoard.Config.Window.EditStageWindow = Ext.extend(Ext.Window, {
	title:'Edit Stage',
	width:700,
	modal:true,
	closeAction:'hide',
	initComponent:function() {
		var config = {
			layout:'form',
			items : [{xtype:'manageStageForm_TaskBoard',
					  ref  :'editStageForm'}]
      };

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.Window.EditStageWindow.superclass.initComponent.apply(this, arguments);
	},
	showWidget:function( notifyPanel ){
		this.notifyPanel = notifyPanel;
		this.clickedPanelID = notifyPanel.clickedPanel.id;
		
		// reset form
		this.editStageForm.reset();
		this.editStageForm.loadData( notifyPanel.clickedPanel );
		
		// set event for widget submit
		this.editStageForm.addEvents('submit info');
		this.editStageForm.on('submit info', this.editStageRequest, this);
		
		this.show();
	},
	editStageRequest : function( name, description, wip ){
		this.hide();
		showMask_TaskBoardConfig();
		
		var sprintID = this.notifyPanel.getComboSprintID();
		Ext.Ajax.request({
			scope	: this,
			url		: 'plugin/taskBoard/config/manageStage/editWorkStage',
			params  :{
				sprintID : sprintID,
				id	: this.clickedPanelID,
				name : name,
				description : description,
				wip : wip
			},
			success : function(response) {
				Ext.example.msg('Edit Stage', 'Edit Stage Success.');
				this.notifyPanel.fireEvent('resetWorkStagesEvent', '');
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			},
			callback : function(){
				hideMask_TaskBoardConfig();
			}
		});
	}
});