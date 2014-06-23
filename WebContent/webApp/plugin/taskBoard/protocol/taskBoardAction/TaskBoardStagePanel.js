Ext.ns('EzScrum.Plugin.TaskBoard');

/**
 * 負責產生Non Checkout Out、CheckOut與Done三個欄位 並且只有相對應ID的Story或Task可以移動到這上面來
 * 
 * @param id
 * @return
 */

EzScrum.Plugin.TaskBoard.StatusColumn = Ext.extend(Ext.Panel, {
	border : true,
	bodyBorder : false,
	columnWidth : .33,
	listeners : {
		render : function(panel) {
			var dropTarget = new Ext.dd.DropTarget(panel.body, {
				realTarget : panel,
				status : panel.status,
				statusID : panel.statusID,
				wip : panel.wip,
				ddGroup : panel.dragID,
				copy : false,
				overClass : 'over',
				add : function(component) {
					panel = this.realTarget;
					panel.add(component);
					panel.doLayout();
					panel.getParent().resetCellHeight();
				},
				insert : function(index, component) {
					panel = this.realTarget;
					panel.insert(index,component);
					panel.doLayout();
					panel.getParent().resetCellHeight();
				}
			});
		}
	},
	getParent : function() {
		return this.findParentBy(function(container, component) {
			return true;
		});
	},
	getAllElementHeight:function()
	{
		//取得底下每個Element的高度
		var h=0;
		for(var i=0;i<this.items.length;i++)
		{
			h+=this.get(i).getHeight();
		}
		return h;
	}
});
Ext.reg('StatusColumn_TaskBoard', EzScrum.Plugin.TaskBoard.StatusColumn);

// function name add "_TaskBoard" to avoid global conflict
function createStoryStagePanel_TaskBoard(stages, storyID) {
	var stageArray = stages;
	
	var stageColumnNumber = 0;
	for(var i = 0; i < stageArray.length; i++){
		if(stageArray[i].subStage != undefined && stageArray[i].subStage != ""){
			stageColumnNumber += stageArray[i].subStage.length;
		}else{
			stageColumnNumber += 1;
		}
	}
	var columnWidthPercent = 1 / stageColumnNumber;
	
	var stagePanel = new Ext.Panel( {
		defaultType : 'StatusColumn_TaskBoard',
		layout : 'column',
		colspan : stageColumnNumber , 
		// Fixed Stage Panel: Story, Not Checked Out, Done
		items : [{	
			id : storyID + '_Story',// Story new
			dragID : storyID,
			statusID : 'Story',
			status : 'Story',
			columnWidth : columnWidthPercent
		}, {
			id : storyID + '_new',// Task new(Not Checked Out)
			dragID : storyID,
			statusID : 'new',
			status : 'new',
			columnWidth : columnWidthPercent
		}, {
			id : storyID + '_closed',// Story/Task Done
			dragID : storyID,
			statusID : 'closed',
			status : 'closed',
			columnWidth : columnWidthPercent
		} ],
		resetCellHeight : function(h) {
			if('undefined' == typeof(h)){
		        h=0;
		    }
			
			for ( var i = 0; i < this.items.length; i++) {
				var h2 = this.get(i).getAllElementHeight();
				if (h2 > h)
					h = h2;
			}
			for ( var i = 0; i < this.colspan; i++) {
				this.get(i).setHeight(h * 1.15);
			}
		}
	});
	
	// Middle Stage
	for(var i = stageArray.length-2; i > 1; i--){// 不算 Story, Not Checked Out, Done欄位
		if(stageArray[i].subStage == undefined || stageArray[i].subStage == "" ){
			var wip = 0;
			if( stageArray[i].wip != 0  && stageArray[i].wip != undefined){
				wip = stageArray[i].wip;
			}
			stagePanel.insert(2, { //從 Not Checked Out 開始插入 Stage
				id : storyID + '_' + stageArray[i].id,
				dragID : storyID,
				statusID : stageArray[i].id,
				status : storyID + '_' + stageArray[i].id,
				wip : wip,
				columnWidth : columnWidthPercent
			});
		}
		else if(stageArray[i].subStage != undefined && stageArray[i].subStage != ""){
			for(var j = stageArray[i].subStage.length-1; j >= 0; j--){
				var wip = 0;
				if( stageArray[i].subStage[j].wip != 0 && stageArray[i].subStage[j].wip != undefined){
					wip = stageArray[i].subStage[j].wip;
				}
				stagePanel.insert(2, { //從 Not Checked Out 開始插入 Stage
					id : storyID + '_' + stageArray[i].subStage[j].id,
					dragID : storyID,
					statusID : stageArray[i].subStage[j].id,
					status : storyID + '_' + stageArray[i].subStage[j].id,
					wip : wip,
					columnWidth : columnWidthPercent
				});
			}
		}
	}
	
	return stagePanel;
}