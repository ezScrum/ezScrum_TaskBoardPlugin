Ext.ns('EzScrum.Plugin.TaskBoard.Window');

function createFeedbackItem_TaskBoard( feedbackInfo ){
	var name = feedbackInfo.name;
	var description = feedbackInfo.description;
	
	var httpKeyword = 'http://';
	var pngKeyword = '.png';
	var jpgKeyword = '.jpg';
	var bmpKeyword = '.bmp';
	var gifKeyword = '.gif';
	
	var itemType = 'text'; // default

	var desc = description.toLowerCase();
	
	// 判斷是否為圖檔連結
	if( ( desc.search( httpKeyword ) >= 0 ) && ( desc.search( pngKeyword ) >= 0 || desc.search( jpgKeyword ) >= 0 || 
												 desc.search( bmpKeyword ) >= 0 || desc.search( gifKeyword ) >= 0) ){
		itemType = 'picture';
		description = '<img src="' + description + '"/>';
	}	
	// 判斷是否為連結
	else if( desc.search( httpKeyword ) >= 0 ){
		itemType = 'connection';
		description = '<a href="'+description+'">'+ description +'</a>';
	}
	
	var feedbackItem;
	// if description contains url or picture extension file name, create a html item
	if( itemType == 'connection' || itemType == 'picture' ){
		feedbackItem = {
				fieldLabel: name,//Health
				width : '100%',
				frame: true,
				html : description
		};
	}
	// if descrition donot contain any url, create a simple textarea item
	else{
		feedbackItem = {
				fieldLabel: name,
				frame : true,
				xtype: 'textarea',
	            disabled : true,
	            width : '100%',
				value : description
			}; 
		}
	return feedbackItem;
}

EzScrum.Plugin.TaskBoard.Window.HealthReportWindow = Ext.extend(Ext.Window, {
    layout      : 'form',
	labelAlign  : 'right',
	buttonAlign	: 'center',
	closeAction : 'hide',		// 當按下關閉時隱藏
	padding 	: '10',
	autoWidth	: true,
	modal       : true,
	resizable   : false,
	autoScroll	: true,
	setHealthReport : function(){
		// remove all item
		this.removeAll();

		for( var i = 0; i < this.feedbacks.length; i++ ){
			feedbackItem = createFeedbackItem_TaskBoard( this.feedbacks[i] );
			this.add( feedbackItem );
		}

		this.add({
			xtype: 'button',
			text	: 'Close',
			autoWidth : true,
			scope	: this,
			buttonAlign	: 'center',
			handler	: function(){this.hide();}
		}); 
		
	},
	issueID: '',
	feedbacks: '',
	showWindow : function( issueID, sprintID ){
		this.issueID = issueID;
		
		Ext.Ajax.request({
			url: 'plugin/taskBoard/ci/getIssueHealthReport',
			scope: this,
			params  :{
				
				sprintID : sprintID,
				issueID : issueID
			},
			success: function(response) { 
				var healthReport = Ext.util.JSON.decode(response.responseText);
				this.feedbacks = healthReport.feedbacks;
				this.setHealthReport();
			},
			callback: function(){
				this.show();
			}
		});
	}
});
