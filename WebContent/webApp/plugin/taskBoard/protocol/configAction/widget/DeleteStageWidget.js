Ext.ns('EzScrum.Plugin.TaskBoard.Config.Window');

/* Delete Stage Widget */
EzScrum.Plugin.TaskBoard.Config.Window.DeleteStageWindow = Ext.extend(Ext.Window, {
	title:'Delete Status',
	padding : '5pt',
	height:120,
	width:480,
	modal:true,
	closeAction:'hide',
	initComponent:function() {
		var config = {
			items:{
				xtype:'label',
				html:'<p>Make sure you want to delete this stage!</p>'+
					 '<p>Caution: The issues belong to this stage would bo back to \'Not Checked Out\'!!!</p>'
			},
			buttons:[
				{text:'Delete',scope:this, handler: this.deleteStageRequest },
				{text:'Cancel',scope:this, handler: this.onCancel }
			]
        };
        
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.Window.DeleteStageWindow.superclass.initComponent.apply(this, arguments);
	},
	// Delete action
	deleteStageRequest : function() {
		this.hide();
		showMask_TaskBoardConfig();
		
		var sprintID = this.notifyPanel.getComboSprintID();
		
		Ext.Ajax.request({
			scope	: this,
			url		: 'plugin/taskBoard/config/manageStage/deleteWorkStage',
			params  :{
				sprintID : sprintID,
				id : this.clickedPanelID
			},
			success : function(response) {
				Ext.example.msg('Delete Stage', 'Delete Stage Success.');
				this.notifyPanel.fireEvent('resetWorkStagesEvent', '');
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			},
			callback : function(){
				hideMask_TaskBoardConfig();
			}
		});
	},
	// 按下取消按鈕 關閉刪除 work stage 視窗
	onCancel : function(){
		this.hide();
	},
	showWidget:function( notifyPanel ){
		this.notifyPanel = notifyPanel;
		this.clickedPanelID = notifyPanel.clickedPanel.id;
		this.show();
	}
});