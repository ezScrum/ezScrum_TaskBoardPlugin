/*******************************************************************************
 * Story Card
 * function name add "_TaskBoard" to avoid global conflict
 ******************************************************************************/

function renderStoryTitle_TaskBoard(record) {
//	var value = makeIssueDetailUrl2(record.get('Link'), record.id);
//	return String.format('  [Story] {0}', value); // Issue ID 的 History
	return String.format('  [Story] ' + record.id);
}

// Story最上層的Title，用一個Table包起來，裡面放Imp. Est. 與動作的Icon
function renderStoryHeader_TaskBoard(record, edit, history, upload) {
	return String.format(
			'<table class="TASKBOARD_STORY_CARD_HEADER">' + 
				'<td><h2>{0}</h2></td>'	+
				'<td align="right">{1}{2}{3}</td>' + 
			'</table>',
			renderStoryTitle_TaskBoard(record), edit, history, upload);
}

// 顯示Story的Attach File
function renderStoryAttachFile_TaskBoard(record) {
	// <p><b>Attach Files:</b><br /><a href="{0}" target="_blank">{1}</a>
	
	var storyId = record.get('Id');
	var fileList = record.get('AttachFileList');

	if (fileList.length == 0)
		return "";

	var result = "<p><b>[Attach Files]</b></p>";
	for (var i = 0; i < fileList.length; i++) {
		result += String.format('<p>'+ (i+1) +'. <a href="{0}" target="_blank">{1}</a>&nbsp;&nbsp;'
		 					  + '<a href="#" onClick="deleteAttachFile_TaskBoard({2}, {3}); false;"><image src="./images/drop2.png"></a>&nbsp;&nbsp;{4}</p>',
				fileList[i].FilePath, fileList[i].FileName, fileList[i].FileId, storyId, fileList[i].UploadDate);
	}
	return result;
}

// 顯示Desciption與Importance
function renderDescription_TaskBoard(description, value, valueName) {
	return String.format(
			'<tr><td class="TASKBOARD_STORY_CARD_DESCRIPTION"><h1>{0}</h1></td>'
					+ '<td class="TASKBOARD_STORY_CARD_VALUE">{1} Point</td></tr>',
			description, value);
}

// 顯示Note與Estimate
function renderNotes_TaskBoard(notes, value) {
	return String.format(
					'<tr><td><b>NOTES:</b></td><td align="center"><b>Estimate</b></td></tr>'
							+ '<tr><td class="TASKBOARD_STORY_CARD_NOTES">{0}</td>{1}</tr>',
					value);

}
/*******************************************************************************
 * 將讀入的Story資料建立成TaskBoard StroyCard的格式
 ******************************************************************************/
function createStoryContent_TaskBoard(story) {
	// 幾個動作Icon的超連結
	var editIcon = '<a href="javascript:editStory_TaskBoard('	+ story.id + ')" title="Edit the Story"><img src="images/edit.png" border="0"></a>';
	var historyIcon = '<a href="javascript:showHistory_TaskBoard(' + story.id + ')" title="Show History"><img src="images/history.png" class="LinkBorder"></a>';
	var uploadIcon = '<a href="javascript:attachFile_TaskBoard(' + story.id + ')" title="Upload File"><img src="images/upload.png" class="LinkBorder"></a>';
	
	return '<table class="TASKBOARD_STORY_CARD_TABLE">'
				+ '<tr><td colspan=2>'
				// ============= Story Title================
				+ renderStoryHeader_TaskBoard(story, editIcon, historyIcon, uploadIcon)
				+ '</td></tr>'
				// ============ Story的描述內容 ==============
				+ renderDescription_TaskBoard(story.get('Name'), story.get('Estimate'))
				// ============ 附加檔案 =====================
				+ '<tr><td colspan="2">'
				+ renderStoryAttachFile_TaskBoard(story) + '</td></tr>'
			+ '</table>';
}

// function name add "_TaskBoard" to avoid global conflict
function createStoryCard_TaskBoard(story) {

	var storyCard = new Ext.Panel({
		id : story.id,
		data : story,
		bodyBorder : false,
		border : false,
		items : [{
			bodyBorder : false,
			border : false,
			html : createStoryContent_TaskBoard(story)
		}],
		// 在 taskboard 上編輯 story 後, update card 內容
		updateData_Edit : function(name, point) {
			var data = this.data;
			data.set('Name', name);
			data.set('Estimate', point);
        	this.items.get(0).update(createStoryContent_TaskBoard(data));
		},
		updateData_AttachFile : function(attachFileList) {
			var data = this.data;
			data.set('AttachFileList', attachFileList);
        	this.items.get(0).update(createStoryContent_TaskBoard(data));
		},
		updateData: function(recordData) { // 目前只需更新 name
			var data = this.data;
			data.set('Name', recordData['Name']);
        	this.items.get(0).update(createStoryContent_TaskBoard(data));
		}
	});

	return storyCard;
}