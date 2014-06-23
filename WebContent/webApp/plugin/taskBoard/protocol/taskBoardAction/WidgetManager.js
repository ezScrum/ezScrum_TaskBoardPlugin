Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Window');

/*
 * 將各個Widget的instance在這new出來, 並且提供function給Story/Task Card呼叫
 */
// Edit Story
EzScrum.Plugin.TaskBoard.Window.EditStoryWidget = new EzScrum.Plugin.TaskBoard.Window.EditStoryWindow();

// Edit Task
EzScrum.Plugin.TaskBoard.Window.EditTaskWidget = new EzScrum.Plugin.TaskBoard.Window.EditTaskWindow();

// Retrieve Issue History
EzScrum.Plugin.TaskBoard.Window.IssueHistoryWidget = new EzScrum.Plugin.TaskBoard.Window.IssueHistoryWindow();

// Attach File
EzScrum.Plugin.TaskBoard.Window.AttachFileWidget = new EzScrum.Plugin.TaskBoard.Window.AttachFileWindow();

// Checked out Task 
EzScrum.Plugin.TaskBoard.Window.CheckOutTaskWidget = new EzScrum.Plugin.TaskBoard.Window.CheckOutWindow();

// Reset Checked out Task, task: Checked out -> Not-Checked out
EzScrum.Plugin.TaskBoard.Window.RECheckOutTaskWidget = new EzScrum.Plugin.TaskBoard.Window.ReCheckOutWindow();

// Done Issue
EzScrum.Plugin.TaskBoard.Window.DoneIssueWidget = new EzScrum.Plugin.TaskBoard.Window.DoneIssueWindow();

// ReOpen Issue
EzScrum.Plugin.TaskBoard.Window.REOpenIssueWidget = new EzScrum.Plugin.TaskBoard.Window.ReOpenIssueWindow();

// Health Report
EzScrum.Plugin.TaskBoard.Window.HealthReportWidget = new EzScrum.Plugin.TaskBoard.Window.HealthReportWindow();


//show edit story widget
function editStory_TaskBoard(id) {
	var taskBoardCardPanel = Ext.getCmp('Plugin_TaskBoardCardPanel'); 
	EzScrum.Plugin.TaskBoard.Window.EditStoryWidget.showTheWindow_Edit( taskBoardCardPanel, id);
}

//show edit task widget
function editTask_TaskBoard(id) {
	var taskBoardCardPanel = Ext.getCmp('Plugin_TaskBoardCardPanel');
	var sprintID = taskBoardCardPanel.getOperatingSprintID();
	EzScrum.Plugin.TaskBoard.Window.EditTaskWidget.loadEditTask(sprintID, id, taskBoardCardPanel);
}

//show check out task widget
function showCheckOutTask_TaskBoard( card, targetStatus ) {
	EzScrum.Plugin.TaskBoard.Window.CheckOutTaskWidget.setCard( card, targetStatus );
	EzScrum.Plugin.TaskBoard.Window.CheckOutTaskWidget.showWidget( card.taskId );
}

//show Reset check out Task widget
function showReCheckOutTask_TaskBoard( card, targetStatus ) {
	EzScrum.Plugin.TaskBoard.Window.RECheckOutTaskWidget.setCard( card, targetStatus );
	EzScrum.Plugin.TaskBoard.Window.RECheckOutTaskWidget.showWidget( card.taskId );
}

//show done task widget
function showDoneIssue_TaskBoard( card, targetStatus ) {
	var taskBoardCardPanel = Ext.getCmp('Plugin_TaskBoardCardPanel');
	var notifyHost = taskBoardCardPanel.notifyHost;
	EzScrum.Plugin.TaskBoard.Window.DoneIssueWidget.setNotifyHost( notifyHost );
	EzScrum.Plugin.TaskBoard.Window.DoneIssueWidget.setCard( card, targetStatus );
	EzScrum.Plugin.TaskBoard.Window.DoneIssueWidget.showWidget( card.taskId );
}

// show reopen issue widget
function showReOpenIssue_TaskBoard( card, targetStatus ) {
	var taskBoardCardPanel = Ext.getCmp('Plugin_TaskBoardCardPanel');
	var notifyHost = taskBoardCardPanel.notifyHost;
	EzScrum.Plugin.TaskBoard.Window.REOpenIssueWidget.setNotifyHost( notifyHost );
	EzScrum.Plugin.TaskBoard.Window.REOpenIssueWidget.setCard( card, targetStatus );
	EzScrum.Plugin.TaskBoard.Window.REOpenIssueWidget.showWidget( card.taskId );
}

// show issue history widget
function showHistory_TaskBoard(issueID) {
	EzScrum.Plugin.TaskBoard.Window.IssueHistoryWidget.showTheWindow(issueID);
}

// show attach file widget
function attachFile_TaskBoard(issueID) {
	EzScrum.Plugin.TaskBoard.Window.AttachFileWidget.attachFile(Ext.getCmp('Plugin_TaskBoardCardPanel'), issueID);
}

//delete file, send ajax request and update the task card
function deleteAttachFile_TaskBoard(file_Id, issue_Id) {
	Ext.MessageBox.confirm('Confirm', 'Are you sure you want to delete this attached file?', function(btn){
		if(btn === 'yes') {
			Ext.Ajax.request({
				url : 'ajaxDeleteFile.do',
				params : {fileId:file_Id, issueId:issue_Id},
				success : function(response) {
					Ext.example.msg('Delete File', 'Success.');
					
					var records = jsonStoryReader.read(response);
					
					if(records.success && records.totalRecords > 0) {
						var record = records.records[0];
						if(record) {
							// update card content
							var issueId = record.data['Id'];
							var issueAttachFileList = record.data['AttachFileList'];
							Ext.getCmp(issueId).updateData_AttachFile(issueAttachFileList);
						}
					}
				},
				failure : function(response) {
					Ext.example.msg('Delete File', 'Failure.');
				}
			});
		}
	});
}

//show issue health report widget
function showHealthReport_TaskBoard( issueID ) {
	var sprintID = Ext.getCmp('Plugin_TaskBoardCardPanel').getOperatingSprintID();
	EzScrum.Plugin.TaskBoard.Window.HealthReportWidget.showWindow( issueID, sprintID );
}

//show config widget mask
function showMask_TaskBoard()
{
	var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
	mask.show();
}

// hide config widget mask
function hideMask_TaskBoard()
{
	var mask = new Ext.LoadMask(Ext.getBody());
	mask.hide();
}