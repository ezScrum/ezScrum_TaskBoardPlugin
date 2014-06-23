/*******************************************************************************
 * Task Card
 * function name add "_TaskBoard" to avoid global conflict
 ******************************************************************************/
function renderTaskTitle_TaskBoard(record) {
	return String.format('  [Task] '+ record.Id);
}

// Story最上層的Title，用一個Table包起來，裡面放Imp. Est. 與動作的Icon
function renderTaskHeader_TaskBoard(record, edit, history, upload, healthReport) {
	return String.format(
			'<table class="TASKBOARD_TASK_CARD_HEADER">' +
				'<td><td><h2>{0}</h2></td>' +
				'<td align="right">{1}{2}{3}{4}</td>' +
			'</table>',
			renderTaskTitle_TaskBoard(record), edit, history, upload, healthReport);
}

// 顯示Story的Attach File
function renderAttachFile_TaskBoard(record) {
	var taskId = record.Id;
	var fileList = record.AttachFileList;

	if (fileList.length == 0)
		return "";

	var result = "<p><b>[Attach Files]</b></p>";
	for ( var i = 0; i < fileList.length; i++) {
		result += String.format('<p>'+ (i+1) +'. <a href="{0}" target="_blank">{1}</a>&nbsp;&nbsp;'
							+ '<a href="#" onClick="deleteAttachFile_TaskBoard({2}, {3}); false;"><image src="./images/drop2.png"></a>&nbsp;&nbsp;{4}</p>',
				fileList[i].FilePath, fileList[i].FileName, fileList[i].FileId, taskId, fileList[i].UploadDate);
	}
	return result;
}

// 顯示Name與Estimate
function taskRenderDescription_TaskBoard(description,value , valueName) {
	return String.format(
			'<tr><td class="TASKBOARD_TASK_CARD_DESCRIPTION"><h1>{0}</h1></td>'
			+'<td class="TASKBOARD_TASK_CARD_VALUE" >{1} hr</td>'
			+'</tr>',description,value);
}

// 顯示Remain Hours與 Handler
function taskRenderRHH_TaskBoard(handler,partners) {
	if(handler.length > 0)
	{
	    var handler = String.format(
	            '<tr><td>By\t<span class="TASKBOARD_TASK_CARD_HANDLER">{0}</span>',handler);
	    if(partners.length > 0)
	    	handler+=' + '+partners;
	    handler+='</td></tr>';
	    return handler;
	}
	else
		return "";
}

function createTaskContent_TaskBoard(task)
{
	var pluginPath = 'pluginWorkspace/TaskBoardPlugin/resource/';
    var editIcon = '<a href="javascript:editTask_TaskBoard(' + task.Id + ')" title="Edit the Task"><img src="'+pluginPath+'images/edit.png" border="0"></a>';
    var historyIcon = '<a href="javascript:showHistory_TaskBoard(' + task.Id + ')" title="Show History"><img src="'+pluginPath+'images/history.png" class="LinkBorder"></a>';
    var uploadIcon = '<a href="javascript:attachFile_TaskBoard(' + task.Id + ')" title="Upload File"><img src="'+pluginPath+'images/upload.png" class="LinkBorder"></a>';
    var ciIcon = '<a href="javascript:showHealthReport_TaskBoard(' + task.Id + ')" title="Health Report"><img src="'+pluginPath+'images/health.png" class="LinkBorder"></a>';
    
    return '<table class="TASKBOARD_TASK_CARD_TABLE">'
                +'<tr><td colspan=2>'
                + renderTaskHeader_TaskBoard(task, editIcon, historyIcon, uploadIcon, ciIcon)
                + '</td></tr>'
                // ============ Story的描述內容 ==============
                +taskRenderDescription_TaskBoard(task.Name,task.RemainHours,'RemainHours')
                // ============ Handler與Remain Hours
                +taskRenderRHH_TaskBoard(task.Handler,task.Partners)
                // ============ 附加檔案 ==============
                +'<tr><td colspan="2">' 
                + renderAttachFile_TaskBoard(task)
                + '</td></tr>' 
          + '</table>';   
}

// function name add "_TaskBoard" to avoid global conflict
function createTaskCard_TaskBoard(task, storyID) {
	
	var taskCard = new Ext.Panel( {
		id : task.Id,
		data:task,
		borderBorder : false,
		border : false,
        setHandlerPartners:function(handler, partners) {//set handler and partners
            var data = this.data;
            data.Handler = handler;
            data.Partners = partners;
            this.items.get(0).update(createTaskContent_TaskBoard(data));
        },
        setRemainHours:function(remainHours) {
        	var data = this.data;
        	data.RemainHours = remainHours;
        	this.items.get(0).update(createTaskContent_TaskBoard(data));
        },
        // 在 taskboard 上編輯 task 後, update card 內容
		updateData_Edit : function(name, handler, partners, remainHours) {
			var data = this.data;
			data.Name = name;
			data.Handler = handler;
			data.Partners = partners;
			data.RemainHours = remainHours;
        	this.items.get(0).update(createTaskContent_TaskBoard(data));
		},
		updateData_AttachFile : function(attachFileList) {
			var data = this.data;
			data.AttachFileList = attachFileList;
        	this.items.get(0).update(createTaskContent_TaskBoard(data));
		},
		updateName : function(name) {
			var data = this.data;
			data.Name = name;
        	this.items.get(0).update(createTaskContent_TaskBoard(data));
		},
		// update Name, Handler, Partners
		updateData : function(recordData) {
			var data = this.data;
			data.Name = recordData['Name'];
			data.Handler = recordData['Handler'];
			data.Partners = recordData['Partners'];
        	this.items.get(0).update(createTaskContent_TaskBoard(data));
		},
		items : [ {
			bodyBorder : false,
			border : false,
			html : createTaskContent_TaskBoard(task)
		} ]
	});
	
    // 設定TaskCard的拖拉物件
    taskCard.draggable = {
        realObject:taskCard,
        taskId : task.Id,
        issueType:'task',
        status : task.PluginStatus,
        ddGroup: storyID,
        parentId: storyID,
        afterDragDrop : function(target, e, targetID) {
        	var status = this.status;

        	var oriStatus = status.slice( status.indexOf("_")+1 );// 就算沒有"_", 回傳值為-1, index +1後也是從0開始
    		var tarStatus = target.status.slice( target.status.indexOf("_")+1 );
        	
            // 如果拖拉的目標Status沒變or目標為story欄位的話，不做任何動作
            if( oriStatus == tarStatus || tarStatus == 'story' ) {
                return;
            }

            var cardCount = target.realTarget.items.length +1;
            if( target.wip != 0 && cardCount > target.wip ){
            	Ext.MessageBox.alert( "WIP Limit","The WIP of stage is " + target.wip );
            	return;
            }
            
            // Task 一開始在 Not Checked Out(new)時
            // Task 剛匯入 plugin DB, 所以狀態為為new 或 assigned, 但會被放置 Not Checked Out(new)
            if( status == 'new' || status == 'assigned'){
            	// check out
            	if( target.status != 'closed' && target.status != 'new' && target.status != 'assigned'){
            		Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showCheckOutTask_TaskBoard, this, target.statusID);
            	}
            }// Task 已經移到Done時
            else if( status == 'closed'){
            	// re open
            	if( target.status != 'new' ){
            		Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showReOpenIssue_TaskBoard, this, target.statusID);
            	}
            }
            else if( status == 'assigned'){
        		Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showCheckOutTask_TaskBoard, this, target.statusID);
            }
            // Task 在中間狀態時
            else{
            	// reset check out
            	if( target.status == 'new' ){
            		Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showReCheckOutTask_TaskBoard, this, target.statusID);
            	}// done
            	else if( target.status == 'closed' ){
            		Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showDoneIssue_TaskBoard, this, target.statusID);
            	}// 在中間狀態間移動
            	else{
            		// 從後面階段往前退
            		if( oriStatus > tarStatus ){
            			Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showReOpenIssue_TaskBoard, this, target.statusID);
            		}// 從前面階段往後退
            		else if( oriStatus < tarStatus ){
            			Ext.getCmp('Plugin_TaskBoardCardPanel').checkIsSprintOverdue(showCheckOutTask_TaskBoard, this, target.statusID);
            		}
            	}
            	
            }
            
        	this.target = target;
        },
        moveToTarget : function() {
        	  this.status = this.target.status;
        	  taskCard.draggable.status = this.target.status; // 抓到的值竟然與 this.status不同, 所以直接塞
        	  
              if(this.status == 'new') {
            	  // 如果移動到New狀態的話，就清空Handler, Partners
            	  this.realObject.setHandlerPartners('','');
              }
              else if(this.status =='closed') {
            	  // 如果移動到Done的話，更新Remain Hours為0
            	  this.realObject.setRemainHours(0);
              }
            this.target.add(taskCard);
        },
        updateName : function(name) {
            this.realObject.updateName(name);
        },
        updateData : function(data) {
            this.realObject.updateData(data);
        }
    };
    
	return taskCard;
}