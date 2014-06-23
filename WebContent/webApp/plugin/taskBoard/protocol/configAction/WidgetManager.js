Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');

/*
 * ----------------*****將各個Widget的instance在這new出來, 並且提供function給Story/Task Card呼叫
 */
// Add Stage
EzScrum.Plugin.TaskBoard.Config.Window.AddStageWidget = new EzScrum.Plugin.TaskBoard.Config.Window.AddStageWindow();

// Add subStage
EzScrum.Plugin.TaskBoard.Config.Window.AddSubStageWidget = new EzScrum.Plugin.TaskBoard.Config.Window.AddSubStageWindow();

// Edit Stage
EzScrum.Plugin.TaskBoard.Config.Window.EditStageWidget = new EzScrum.Plugin.TaskBoard.Config.Window.EditStageWindow();

// Delete Stage
EzScrum.Plugin.TaskBoard.Config.Window.DeleteStageWidget = new EzScrum.Plugin.TaskBoard.Config.Window.DeleteStageWindow();


// show add stage widget
function showAddStageWidget_TaskBoard( panel ) {
	var notifyPanel = panel;
	// 限制長度最大為9, 若未來要擴充把判斷拿掉即可, 後端action是可支援的
	if( notifyPanel.items.length >= 9 ) {
		return true; // disable to add stage
	}
	EzScrum.Plugin.TaskBoard.Config.Window.AddStageWidget.showWidget( notifyPanel );
}

// show add subStage widget
function showAddSubStageWidget_TaskBoard( panel ) {
	var notifyPanel = panel;// 整個 manage panel
	var parentPanel = panel.clickedPanel;
	// 子階段限制長度最大為9, 因為stage id 設計的問題, 所以現階段subStage無法超過9
	if( parentPanel.items.length >= 9 ) {
		return true; // disable to add sub stage
	}
	EzScrum.Plugin.TaskBoard.Config.Window.AddSubStageWidget.showWidget( notifyPanel );
}

// show edit stage widget
function showEditStageWidget_TaskBoard( panel ) {
	var notifyPanel = panel;
	// show widget, set notifyPanel to set data
	EzScrum.Plugin.TaskBoard.Config.Window.EditStageWidget.showWidget( notifyPanel );
}

// show delete stage widget
function showDeleteStageWidget_TaskBoard( panel ) {
	var notifyPanel = Ext.getCmp('ManageWorkStagePanel_TaskBoard');
	// 限制 middle stage 至少要留一個, 否則Task Board 那邊會沒有中間階段可以拖拉
	if( notifyPanel.items.length == 4 ) {// Story, Not Checked Out, Done 為固定欄位
		return true; // disable to delete
	}
	EzScrum.Plugin.TaskBoard.Config.Window.DeleteStageWidget.showWidget( notifyPanel );
}

// get work stage information by stage id
function getWorkStageInfo_TaskBoardConfig( stageID ){
	var ManageWorkStagePanel = Ext.getCmp('ManageWorkStagePanel_TaskBoard');
	
	var stageArray = ManageWorkStagePanel.getWorkStages();
	
	var stageInfo;
	for( var i = 0; i < stageArray.length; i++ ){
		if( stageArray[i].subStage != undefined ) {
			var subStageNumber = stageArray[i].subStage.length;
			
			for( var j = 0; j < subStageNumber; j++ ) {
				if( stageID == stageArray[i].subStage[j].id ){
					stageInfo = stageArray[i].subStage[j];
					break;
				}
			}
		}
		if( stageInfo ){
			break;
		}
		if( stageID == stageArray[i].id ){
			stageInfo = stageArray[i];
			break;
		}
	}
	return stageInfo; 
}

// 建立 sub Stage Panel
function createConfigSubStagePanel_TaskBoard( id, width, headerCSS, headerHeight, subStageName ) {
	
	var newSubStage = new Ext.Panel({
		id	: id,
		level : 2,
		height : 112, // height for panel, not header
		width : width-1,
		border : true,
		overCls : 'TASKBOARD_CARD_MOVEON_ICON', // level two stage should be availabe to DD.
		html : '<table class=' + headerCSS + '>' +
		'<tr><td colspan=2>' +
		'<td height=' + headerHeight + '><h2>' + subStageName + '</h2></td>'	+
		'</td></tr>' +
		'</table>'
	});
	
	return newSubStage;
}

// 建立 Stage Panel
function createConfigStagePanel_TaskBoard( id, width, headerCSS, headerHeight, cursorOverCls, stageName, subStageArray ) {
	
	var newStage = new Ext.Panel({
		id : id,
		level : 1,
		layout: 'column',
		border : true,
		height : 150, // height for panel, not header
		width : width,
		items : subStageArray,
		overCls : cursorOverCls, // level one stage may be DD or not. 
		html : '<table class=' + headerCSS + '>' +
					'<tr><td colspan=2>' +
					'<td height=' + headerHeight + '><h2>' + stageName + '</h2></td>'	+
					'</td></tr>' +
				'</table>'
	});
	
	return newStage;
}

// show config widget mask
function showMask_TaskBoardConfig()
{
	var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
	mask.show();
}

// hide config widget mask
function hideMask_TaskBoardConfig()
{
	var mask = new Ext.LoadMask(Ext.getBody());
	mask.hide();
}