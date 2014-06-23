// inner plugin namespace : EzScrum.Plugin.... 
Ext.ns('EzScrum.Plugin.TaskBoard');

EzScrum.Plugin.TaskBoard.TaskboardContentPanel = Ext.extend(Ext.Panel, {
	id	   : 'Plugin_TaskBoardCardPanel',
	header : false,
	layout : 'fit',
	notifyHost : '',
    initComponent : function() {
    	this.notifyHost = this.params.host;

    	EzScrum.Plugin.TaskBoard.TaskboardContentPanel.superclass.initComponent.apply(this);
	},
    loadDataModel: function() {
    	this.loadData('currentSprint', 'ALL');
    },
    loadData: function(sprintID, handler) {
    	var obj = this;
    	// call stapler action 正確取得所有WorkStage的資訊後，再call struts action 取得 StoryTaskList (記得搬到stapler去)
    	//http://localhost:8080/ezScrum/plugin/taskBoard/config/getWorkStages?sprintID=sprintNumber
		Ext.Ajax.request({
			url : 'plugin/taskBoard/config/getWorkStages',
			params : {sprintID : sprintID},
			success : function(response) {
				var stageInfo = Ext.util.JSON.decode(response.responseText);
				obj.stageArray = stageInfo.stages;
			},
			failure : function() {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
			},
			callback: function(){
				// 取得 Sprint Backlog 所包含的Story 及 Task資料
				//http://localhost:8080/ezScrum/plugin/taskBoard/getTaskBoardStoryTaskList?sprintID=sprintID&handlerID=handler
				Ext.Ajax.request({
					url : 'plugin/taskBoard/getTaskBoardStoryTaskList',
					params : {
						sprintID : sprintID, 
						handlerID : handler
					},
					success : function(response) {
						EzScrum.Plugin.TaskBoard.StoryStore.loadData(Ext.decode(response.responseText));
					},
					failure : function() {
						Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
					},
					callback : function() {
						obj.initialTaskBoard();
					}
				});
			}
		});
	},
	initialTaskBoard: function() {
		// remove all items (for選擇其它sprint時以AJAX的形式更新，取代切換頁面的形式)
		this.removeAll();
		this.add({
			xtype: 'TaskboardCardHeaderPanel_TaskBoard',
			ref: 'headerPanel',
			value: this.stageArray
		}); 
		this.headerPanel.init_StatusPanel();
		// 先將panel重新呈現Layout, 這樣stagePanel reset height時才抓得到元件
		this.doLayout();
		
		for ( var i = 0; i < EzScrum.Plugin.TaskBoard.StoryStore.getCount(); i++) {
			var story = EzScrum.Plugin.TaskBoard.StoryStore.getAt(i);

			// 建立StatusPanel，GroupID則是依照StoryID，並且每個Panel再設置其所代表的Status
			// createStoryStagePanel_TaskBoard function 在 TaskBoardPlugin\WebContent\webApp\TaskBoardStagePanel.js
			var stagePanel = createStoryStagePanel_TaskBoard(this.stageArray, story.id);
			this.headerPanel.add(stagePanel);

			// createStoryCard function 在 TaskBoardPlugin\WebContent\webApp\TaskBoard\StoryCard.js
			var storyCard = createStoryCard_TaskBoard(story);

			// 將 Story 放置 Story 欄位
			stagePanel.get(story.id + '_Story').add(storyCard);
			
			// 依據Task的狀態，將卡片設置到對應的Stage
			// 相同Story的Task會放在同一個Stage Panel裡面
			var tasks = story.get('Tasks');
			for ( var j = tasks.length-1 ; j >= 0; j--) {
				var task = tasks[j];
				
				var taskCard = createTaskCard_TaskBoard(task, story.id, story.get('Sprint'));
				
				// task 狀態為 new/closed 固定不會被變動的欄位
				if( task.Status == 'new' || task.Status == 'closed' ){
					stagePanel.get(story.id + '_' + task.Status).add(taskCard);
				} 
				else{ // task 狀態為中間過程的狀態，ezScrum裡為 assigned，plugin的狀態則另存
					
					// plugin DB 裡剛匯入此issue, 因此狀態為 assigned
					// 由於此 issue 還沒有 plugin 中間階段的狀態, 所以放置Not Checked Out
					if( task.PluginStatus == 'assigned' ){
						stagePanel.get(story.id + '_new').add(taskCard);
					}
					else{ // 此issue已有plugin中間階段的狀態
						
						if( stagePanel.get(story.id + '_' + task.PluginStatus) != undefined ){
							stagePanel.get(story.id + '_' + task.PluginStatus).add(taskCard);
						}
						else{ // 避免資料錯誤, 找不到階段就放置 new, 進行一次的拖拉後就可以更新狀態
							stagePanel.get(story.id + '_new').add(taskCard);
						}
					}
				}
			}
			
			// 讓taskboard重新進行Layout以便可以計算Stroy或Task的高度，再去重設其他沒有放Story或Task的Panel
			this.headerPanel.doLayout();
			stagePanel.resetCellHeight();
		}
	},
	// 移動 TaskCard、StoryCard 時，以當前的日期作確認是否為過期的Sprint
	setOperatingSprintID: function( comboID ) {
		this.OperatingSprintID = comboID;
	},
	getOperatingSprintID: function() {
		// get combo sprint id
		this.notifyHost.fireEvent('getOperatingSprintID', this);
		return this.OperatingSprintID;
	},
	// 確認當前操作的sprint是否為過期的sprint
	checkIsSprintOverdue: function() {
		// 將所有參數轉為真正的Array
		var args = Array.prototype.slice.call(arguments);
		var fun = args.shift();
		var obj = this;
		var sprintID = obj.getOperatingSprintID();
		
		// http://localhost:8080/ezScrum/plugin/taskBoard/config/checkIsSprintOverdue?sprintID=sprintNumber
		Ext.Ajax.request({
			url : 'plugin/taskBoard/config/checkIsSprintOverdue',
			params: { sprintID: sprintID },
			success: function(response) {
				// 判斷目前的˙Sprint 是否為過期的
				var isOverdue = response.responseText;
				
				if ( isOverdue == "false" ) {
					fun.apply(obj, args);
				} else {
					Ext.MessageBox.confirm("Warning!", 'The sprint is overdue.', function(btn) {
						// 如果使用者按下Yes才會繼續執行動作
						if (btn == 'yes') {
							fun.apply(obj, args);
						}
					});
				}
			},
			failure: function(response) {
				Ext.example.msg('Server Error', 'Sorry, the connection is failure.');				
			}
		});
	},
	notify_EditStory: function(success, response, record) {
		EzScrum.Plugin.TaskBoard.Window.EditStoryWidget.hide();
		
		var title = 'Edit Story';
		if (success) {
			Ext.example.msg(title, 'Success.');
			
			// update Story Card Info
			var storyId = record.data['Id'];
			var storyName = record.data['Name'];
			var storyEstimation = record.data['Estimation'];
			Ext.getCmp(storyId).updateData_Edit(storyName, storyEstimation);

			// update Sprint Desc. and Burndown Chart
			var sprintID = '';
			this.notifyHost.fireEvent('notifyReloadSprintInfoForm', sprintID);
			this.notifyHost.fireEvent('notifyReloadBurndownChartForm', sprintID);
			
		} else {
			Ext.example.msg(title, 'Sorry, please try again.');
		}
	},
	notify_EditTask: function(record) {
		EzScrum.Plugin.TaskBoard.Window.EditTaskWidget.hide();// share component
		Ext.example.msg('Edit Task', 'Success.');
		
		// update Task Card Info
		var taskId = record.data['Id'];
		var taskName = record.data['Name'];
		var taskHandler = record.data['Handler'];
		var taskPartners = record.data['Partners'];
		var taskRemainHours = record.data['Remains'];
		Ext.getCmp(taskId).updateData_Edit(taskName, taskHandler, taskPartners, taskRemainHours);
		
		// update Sprint Desc. and Burndown Chart
		var sprintID = '';
		this.notifyHost.fireEvent('notifyReloadSprintInfoForm', sprintID);
		this.notifyHost.fireEvent('notifyReloadBurndownChartForm', sprintID);
	},
	notify_AttachFile: function(success, record, msg) {
		EzScrum.Plugin.TaskBoard.Window.AttachFileWidget.hide();
		
		var title = 'Attach File';
		if(success) {
			Ext.example.msg(title, 'Success.');
			
			// update Task Card Info
			var issueId = record.data['Id'];
			var issueAttachFileList = record.data['AttachFileList'];
			Ext.getCmp(issueId).updateData_AttachFile(issueAttachFileList);			
		}else{
			Ext.example.msg(title, msg);
		}
	}
});

EzScrum.Plugin.TaskBoard.TaskBoardPlugin = Ext.extend(Ext.util.Observable,{
	board:[],
	init:function(cmp){// owner component

		this.hostCmp = cmp;
		
		this.board = new EzScrum.Plugin.TaskBoard.TaskboardContentPanel({params: { host: this.hostCmp }});
		
		this.hostCmp.add( this.board );
		this.hostCmp.doLayout();
		
		// plug-in event: loadData, loadDataModel
		this.addEvents('initloadData', 'reloadData');
		this.on('initloadData', this.initloadData);
		this.on('reloadData', this.reloadData);

	},
	initloadData: function(){
		this.board.loadDataModel();
	},
	reloadData:function(sprintID, userID){
		this.board.loadData(sprintID, userID);
	}
});
// register plugin, id: TaskBoardPlugin 
Ext.preg('TaskBoardPlugin', EzScrum.Plugin.TaskBoard.TaskBoardPlugin);

