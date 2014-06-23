Ext.ns('EzScrum.Plugin.TaskBoard');
Ext.ns('EzScrum.Plugin.TaskBoard.Config');
//Ext.ns('ezScrum');

EzScrum.Plugin.TaskBoard.Config.Store = new Ext.data.SimpleStore({
	fields:['id','value']
});

EzScrum.Plugin.TaskBoard.Config.sprintIDCombobox = new Ext.form.ComboBox({
	   fieldLabel: 'Sprint',
	   name: 'sprint number',
	   mode: 'local',
	   width: 80,
	   store: EzScrum.Plugin.TaskBoard.Config.Store,
	   displayField:'id',
	   valueField:'value',
	   typeAhead: true,
	   triggerAction:'all',
	   editable: false,
	   forceSelection: true,
	   blankText: 'choose one sprint',
	   listeners:{
			'select':function(){//select combobox to choose work stages
				EzScrum.Plugin.TaskBoard.Config.ManageWorkStageWidget.fireEvent('resetWorkStagesEvent', this.getValue() );
			},
			'resetSprintIDEvent': function(){
				this.reloadSprintIDCombo();
			}
	   },
	   reloadSprintIDCombo:function(){
			var currentSprintID = '';
			Ext.Ajax.request({
				scope	: this,
				url		: 'plugin/taskBoard/config/getSprintIDStringList',
				success : function(response) {
					var sprintIDArray = response.responseText.split(',');
					var array = [];
					var sprintID = '' ;
					for( var i = 0 ; i < sprintIDArray.length ; i++){
						sprintID = sprintIDArray[i];
						array.push( [ sprintID, sprintID ] );
					}
					currentSprintID = sprintID;
					EzScrum.Plugin.TaskBoard.Config.Store.loadData( array );//load sprint combobox data from server
				},
				callback: function(){
					this.setValue( currentSprintID );
					//reset work stages by current sprintID
					EzScrum.Plugin.TaskBoard.Config.ManageWorkStageWidget.fireEvent('resetWorkStagesEvent', currentSprintID );
				},
				failure : function() {
					Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
				}
			});
	   }
});

EzScrum.Plugin.TaskBoard.Config.ManageWorkStagePanel = Ext.extend(Ext.Panel, {
	title	: 'Modify Work Stage',
	id : 'ManageWorkStagePanel_TaskBoard',
	region : 'center',
	stageArray : '',
	plugins: [ new EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDragZone(2, 1), 
	           new EzScrum.Plugin.TaskBoard.Config.DragDrop.PanelFieldDropZone(2, 1) ],
	initComponent : function() {
		var config = {
				layout: 'column',
				layoutConfig: {
				    padding: '10',
				    align: 'left'
				},
				autoScroll:true,
				autoHeight: true,
				autoWidth		: true,
			    modal       	: true,
			    closeAction 	: 'hide',		// 當按下關閉時隱藏
			    constrain		: true,			// 限制視窗不能超出目前頁面
			    resizable		: true,
			    autoDestroy : false,
			    clickPanel	: '',
			    tbar: [
		           EzScrum.Plugin.TaskBoard.Config.sprintIDCombobox,{
		        	id:'addStageBtn_TaskBoard',
					text : 'Add Stage',
					icon : 'images/add3.png',
					scope : this,
					disabled : false,
					handler:function(){
						var disable = showAddStageWidget_TaskBoard( this );
						if( disable ){
							Ext.MessageBox.alert( "Add Stage Failure","The max stage length limit is 9." );
						}
					}
				}, {
					id:'addSubStageBtn_TaskBoard',
					text : 'Add SubStage',
					icon : 'images/add3.png',
					scope : this,
					disabled : true,
					handler:function(){
						var disAddable = showAddSubStageWidget_TaskBoard( this );
						if( disAddable ){
							Ext.MessageBox.alert( "Add SubStage Failure","The stage length limit is 9." );
						}
					}
				}, {
					id:'editStageBtn_TaskBoard',
					text : 'Edit Stage',
					icon : 'images/edit.png',
					scope : this,
					disabled : true,
					handler:function(){
						showEditStageWidget_TaskBoard( this );
					}
				}, {
					// delete a sprint
					id:'deleteStageBtn_TaskBoard',
					text : 'Delete Stage',
					icon : 'images/drop2.png',
					scope : this,
					disabled : true,
					handler:function(){
						var disable = showDeleteStageWidget_TaskBoard( this );
						if( disable ){
							Ext.MessageBox.alert( "Delete Stage Failure","The middle stage must reserve at least one stage." );
						}
					}
				}]
		};
		
		Ext.apply(this, Ext.apply(this.initialConfig, config));
		EzScrum.Plugin.TaskBoard.Config.ManageWorkStagePanel.superclass.initComponent.apply(this, arguments);
	},
	loadMiddleStage : function(){
		this.removeAll(true);
		
		// stage header default height, stage default width 
		var defaultHeaderHeight = 30;
		var defaultStageWidth = 140;
		
		// adjust header height if there is subStage
		for(var i = 2; i < this.stageArray.length-1; i++){
			if(this.stageArray[i].subStage != undefined){
				defaultHeaderHeight = 60;
				break;
			}
		}
		
		for(var i = 0; i < this.stageArray.length; i++){
			// set stage header and cursor CSS 
			var headerCSS = '';
			var cursorOverCls = '';
			// Story, Not Checked Out
			if( i <= 1 ){ 
				headerCSS = 'TASKBOARD_NOT_CHECKOUT_HEADER';
			}// Done
			else if( i == this.stageArray.length - 1 ){ 
				headerCSS = 'TASKBOARD_DONE_HEADER';
			}// Middle stage
			else{ 
				headerCSS = 'TASKBOARD_CHECKOUT_HEADER';
				if( i != 1){
					cursorOverCls = 'TASKBOARD_CARD_MOVEON_ICON';
				}
			}
			
			// adjust the stage height and width which contains subStages or not
			var headerHeight = defaultHeaderHeight;
			var stageWidth = defaultStageWidth;

			// add subStages
			var subStageArray = [];
			if(this.stageArray[i].subStage != undefined && this.stageArray[i].subStage != "" ) {
				headerHeight /= 2;
				
				var subStageNumber = this.stageArray[i].subStage.length;
				
				stageWidth = ( subStageNumber > 1 ? stageWidth * subStageNumber : stageWidth );
				
				for(var j = 0; j < subStageNumber; j++) {
					var subStageName = this.stageArray[i].subStage[j].name; 
					if( this.stageArray[i].subStage[j].wip != undefined ){
						subStageName += '('+this.stageArray[i].subStage[j].wip+')';
					}
					
					var id = this.stageArray[i].subStage[j].id;
					
					// function createSubStagePanel_TaskBoard( id, width, headerCSS, headerHeight, subStageName )
					var subStage = createConfigSubStagePanel_TaskBoard( id, defaultStageWidth, headerCSS, headerHeight, subStageName );
					
					subStageArray.push( subStage ); 
				}
			}
			
			var stageName = this.stageArray[i].name; 
			if( this.stageArray[i].wip != undefined ){
				stageName += '('+this.stageArray[i].wip+')';
			}
			
			var id = this.stageArray[i].id;
			
			// function createConfigStagePanel_TaskBoard( id, width, headerCSS, headerHeight, cursorOverCls, stageName, subStageArray ) {
			var stage = createConfigStagePanel_TaskBoard( id, stageWidth, headerCSS, headerHeight, cursorOverCls, stageName, subStageArray );
			
			this.add( stage );
			this.doLayout();
    	}
		hideMask_TaskBoardConfig();
	},
	getWorkStages : function(){
		return this.stageArray;
	},
	getComboSprintID : function(){
		var sprintID = this.topToolbar.get(0).getValue();
		return sprintID;
	},
	clickedPanel : '',
	setClickedPanel : function( panel ){
		this.clickedPanel = panel;
	},
	isSprintOverdue : '',
	listeners:{
		  'resetWorkStagesEvent': function( sprintID ){
			  showMask_TaskBoardConfig();
			  
			  var sprint = sprintID;
			  if( sprintID == undefined || sprintID == '' ){
				  sprint = this.getComboSprintID();
			  }
			  Ext.Ajax.request({
					scope	: this,
					url		: 'plugin/taskBoard/config/getWorkStages',
					params  :{
						sprintID : sprint
					},
					success : function(response) { 
						var stageInfo = Ext.util.JSON.decode(response.responseText);
						this.stageArray = stageInfo.stages;
						this.fireEvent('checkIsSprintOverdue');
					},
					failure : function() {
						Ext.example.msg('Server Error', 'Sorry, the connection is failure.');
					},
					callback : function(){
						this.loadMiddleStage();
					}
				});
		  },
		  'checkIsSprintOverdue': function(){
			// http://localhost:8080/ezScrum/plugin/taskBoard/config/checkIsSprintOverdue?sprintID=sprintNumber
				 Ext.Ajax.request({
					 scope	: this,
					 url : 'plugin/taskBoard/config/checkIsSprintOverdue',
					 params: { sprintID: this.getComboSprintID() },
					 success: function(response) {
						 // 判斷目前的˙Sprint 是否為過期的
						 var isOverdue = response.responseText;
						 
						 if ( isOverdue == "false") {// action 回來的為 string, 再看有沒有辦法改善
							 this.isSprintOverdue = false;  
							 this.notifyBtnPermission( true, false, false, false );
						 } else {
							 this.isSprintOverdue = true;
							 this.notifyBtnPermission( false, false, false, false );
						 }
					 },
					 failure: function(response) {
						 Ext.example.msg('Server Error', 'Sorry, the connection is failure.');				
					 }
				 });
		  } 
	 },
	 notifyBtnPermission : function( addStagePermission, addSubStagePermission, editStagePermission, deleteStagePermission )
	 {
		 this.getTopToolbar().get('addStageBtn_TaskBoard').setDisabled( ! addStagePermission );
		 this.getTopToolbar().get('addSubStageBtn_TaskBoard').setDisabled( ! addSubStagePermission );
		 this.getTopToolbar().get('editStageBtn_TaskBoard').setDisabled( ! editStagePermission );
		 this.getTopToolbar().get('deleteStageBtn_TaskBoard').setDisabled( ! deleteStagePermission );
	 }
});

EzScrum.Plugin.TaskBoard.Config.ManageWorkStageWidget = new EzScrum.Plugin.TaskBoard.Config.ManageWorkStagePanel();