Ext.ns('EzScrum.Plugin.TaskBoard.Config');

EzScrum.Plugin.TaskBoard.Config.TaskBoardConfigPlugin = Ext.extend(Ext.util.Observable,{
	init:function(cmp){
		this.hostCmp = cmp;
		this.hostCmp.on('render', this.onRender, this, {delay:200});
		this.on({
			'show':function(){
				EzScrum.Plugin.TaskBoard.Config.sprintIDCombobox.fireEvent('resetSprintIDEvent');
			}
		});
	},
	onRender: function(){
		this.hostCmp.add(  
			EzScrum.Plugin.TaskBoard.Config.ManageWorkStageWidget
		);
		this.hostCmp.doLayout();
	}
});

Ext.preg('TaskBoardPlugin', EzScrum.Plugin.TaskBoard.Config.TaskBoardConfigPlugin);